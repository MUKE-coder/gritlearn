// Plugin host — loads every installed plugin's JS at app boot and
// exposes a small JEditor global the plugin can use to extend the
// editor.
//
// Scope (deliberately small):
//   JEditor.commands.register(id, label, fn)  — show up in the
//                                                command palette + can
//                                                be triggered from
//                                                other plugins.
//   JEditor.commands.run(id, ...args)         — execute a command.
//   JEditor.events.on(event, fn)              — subscribe to:
//     "fileOpen"   ({ path })
//     "fileSaved"  ({ path })
//     "phaseEnter" ({ phaseId })
//   JEditor.events.emit(event, payload)       — emit a custom event
//                                                (other plugins listen).
//   JEditor.workspace.openFile(path)
//   JEditor.workspace.getRoot()
//   JEditor.ui.notify(text, "info"|"error")  — toast bar at the
//                                              bottom of the editor.
//
// No sandbox — plugins run in the same realm as the host. The
// Settings UI labels them as "Trust the source" so this matches the
// install-from-URL flow we ship.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../wailsjs/go/main/App";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions?: string[];
}

export interface PluginRecord {
  manifest: PluginManifest;
  enabled: boolean;
  source: string;
  installed_at: string;
}

export interface PluginCommand {
  id: string;
  label: string;
  pluginId: string;
  run: (...args: unknown[]) => void;
}

export interface PluginEvent {
  name: string;
  payload?: unknown;
}

export interface Toast {
  id: string;
  text: string;
  level: "info" | "error";
}

interface PluginHostValue {
  records: PluginRecord[];
  commands: PluginCommand[];
  toasts: Toast[];
  dismissToast: (id: string) => void;
  refresh: () => Promise<void>;
  runCommand: (id: string, ...args: unknown[]) => void;
  emit: (event: string, payload?: unknown) => void;
}

const PluginHostContext = createContext<PluginHostValue | null>(null);

export function usePluginHost(): PluginHostValue {
  return useContext(PluginHostContext) ?? {
    records: [],
    commands: [],
    toasts: [],
    dismissToast: () => {},
    refresh: async () => {},
    runCommand: () => {},
    emit: () => {},
  };
}

// PluginHostProvider mounts plugins + exposes the JEditor global. It
// keeps a per-plugin cleanup list (unregistered commands + event
// subscriptions) so disabling / uninstalling a plugin doesn't leak.
export function PluginHostProvider({
  children,
  workspace,
}: {
  children: ReactNode;
  /** Plumbed in from app.tsx so plugins can call workspace.openFile() etc.
   *  without us having to import the workspace store here (would create
   *  a circular dep with the editor components). */
  workspace: {
    openFile: (path: string) => Promise<void>;
    getRoot: () => string | null;
  };
}) {
  const [records, setRecords] = useState<PluginRecord[]>([]);
  const [commands, setCommands] = useState<PluginCommand[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Per-plugin cleanup so disable/uninstall removes its commands +
  // event listeners. The host owns the maps; plugins never see them.
  const [, setVersion] = useState(0);
  const eventBus = useMemo(() => new EventTarget(), []);

  // Internal registries — refs would be nicer but state makes the
  // memoized JEditor object re-create when plugins (un)register, which
  // keeps React happy.
  const [cmds] = useState(() => new Map<string, PluginCommand>());
  const [cleanups] = useState(() => new Map<string, Array<() => void>>());

  const refresh = useCallback(async () => {
    try {
      const list = ((await App.ListPlugins()) as PluginRecord[]) ?? [];
      setRecords(list);
      await reloadPlugins(list);
    } catch (err) {
      console.error("[plugins] list failed", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unloadPlugin = useCallback(
    (pluginId: string) => {
      const closers = cleanups.get(pluginId) ?? [];
      for (const fn of closers) {
        try {
          fn();
        } catch (e) {
          console.error("[plugins] cleanup failed", pluginId, e);
        }
      }
      cleanups.delete(pluginId);
      for (const [id, cmd] of cmds) {
        if (cmd.pluginId === pluginId) cmds.delete(id);
      }
      setCommands([...cmds.values()]);
      setVersion((v) => v + 1);
    },
    [cmds, cleanups],
  );

  const reloadPlugins = useCallback(
    async (list: PluginRecord[]) => {
      // Unload existing first so re-enabling a plugin re-runs activate.
      for (const id of [...cleanups.keys()]) unloadPlugin(id);

      for (const rec of list) {
        if (!rec.enabled) continue;
        try {
          const src = (await App.GetPluginCode(rec.manifest.id)) as string;
          loadPluginCode(rec.manifest.id, src);
        } catch (err) {
          console.error("[plugins] load failed", rec.manifest.id, err);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanups, cmds, unloadPlugin],
  );

  const loadPluginCode = useCallback(
    (pluginId: string, src: string) => {
      const closers: Array<() => void> = [];
      cleanups.set(pluginId, closers);

      const jeditorApi = {
        commands: {
          register(id: string, label: string, run: (...args: unknown[]) => void) {
            const cmd: PluginCommand = { id, label, pluginId, run };
            cmds.set(id, cmd);
            setCommands([...cmds.values()]);
            closers.push(() => {
              cmds.delete(id);
              setCommands([...cmds.values()]);
            });
          },
          run(id: string, ...args: unknown[]) {
            const cmd = cmds.get(id);
            if (cmd) cmd.run(...args);
          },
        },
        events: {
          on(name: string, fn: (payload: unknown) => void) {
            const wrapped: EventListener = (e) => {
              const ce = e as CustomEvent;
              try {
                fn(ce.detail);
              } catch (err) {
                console.error(`[plugins][${pluginId}] handler ${name}`, err);
              }
            };
            eventBus.addEventListener(name, wrapped);
            closers.push(() => eventBus.removeEventListener(name, wrapped));
          },
          emit(name: string, payload?: unknown) {
            eventBus.dispatchEvent(new CustomEvent(name, { detail: payload }));
          },
        },
        workspace: {
          openFile(path: string) {
            return workspace.openFile(path);
          },
          getRoot() {
            return workspace.getRoot();
          },
        },
        ui: {
          notify(text: string, level: "info" | "error" = "info") {
            const id = `t_${Math.random().toString(36).slice(2)}`;
            setToasts((prev) => [...prev, { id, text, level }]);
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4500);
          },
        },
        version: "1",
      };

      try {
        // Run the plugin source. The plugin sees `JEditor` (passed
        // as an argument) AND can read it off `window` for
        // convenience.
        const fn = new Function("JEditor", "console", src);
        (window as unknown as { JEditor: typeof jeditorApi }).JEditor = jeditorApi;
        fn(jeditorApi, console);
      } catch (err) {
        console.error(`[plugins][${pluginId}] activate failed`, err);
        // Unload anything the plugin managed to register before the
        // throw, so we don't leave half-state behind.
        unloadPlugin(pluginId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cmds, cleanups, eventBus, workspace, unloadPlugin],
  );

  // Initial load.
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCommand = useCallback(
    (id: string, ...args: unknown[]) => {
      const cmd = cmds.get(id);
      if (cmd) cmd.run(...args);
    },
    [cmds],
  );

  const emit = useCallback(
    (name: string, payload?: unknown) => {
      eventBus.dispatchEvent(new CustomEvent(name, { detail: payload }));
    },
    [eventBus],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: PluginHostValue = {
    records,
    commands,
    toasts,
    dismissToast,
    refresh,
    runCommand,
    emit,
  };

  return (
    <PluginHostContext.Provider value={value}>
      {children}
    </PluginHostContext.Provider>
  );
}
