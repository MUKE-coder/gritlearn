/// <reference types="vite/client" />

// Wails bindings are injected at runtime. This is a placeholder type
// so TypeScript doesn't complain before the first build.
declare global {
  interface Window {
    runtime?: {
      EventsOn: (event: string, callback: (...args: unknown[]) => void) => void;
      EventsEmit: (event: string, ...args: unknown[]) => void;
    };
    go?: {
      main: {
        App: {
          SetToken: (key: string, value: string) => Promise<void>;
          GetToken: (key: string) => Promise<string>;
          DeleteToken: (key: string) => Promise<void>;
          MinimiseWindow: () => Promise<void>;
          MaximiseWindow: () => Promise<void>;
          UnmaximiseWindow: () => Promise<void>;
          ToggleMaximise: () => Promise<void>;
          CloseWindow: () => Promise<void>;
          IsMaximised: () => Promise<boolean>;
          OpenFileDialog: (title: string) => Promise<string>;
          SaveFileDialog: (title: string, defaultFilename: string) => Promise<string>;
          GetPlatform: () => Promise<"darwin" | "windows" | "linux">;
          GetAppVersion: () => Promise<string>;
          // Offline sync bindings — see apps/desktop/sync.go.
          LocalCreate: (table: string, id: string, data: Record<string, unknown>) => Promise<void>;
          LocalUpdate: (table: string, id: string, data: Record<string, unknown>) => Promise<void>;
          LocalDelete: (table: string, id: string) => Promise<void>;
          LocalGet: (table: string, id: string) => Promise<Record<string, unknown> | null>;
          LocalList: (table: string) => Promise<Record<string, unknown>[]>;
          Sync: (tables: string[]) => Promise<unknown>;
          PendingCount: () => Promise<number>;
          GetPendingChanges: () => Promise<unknown[]>;
          ResolveConflict: (
            table: string,
            entityID: string,
            mergedData: Record<string, unknown>,
            serverVersion: number,
          ) => Promise<void>;
        };
        // Auto-updater bindings — see apps/desktop/updater.go.
        Updater: {
          StartDownload: (url: string, version: string) => Promise<void>;
          GetProgress: () => Promise<{
            status: "idle" | "downloading" | "downloaded" | "installing" | "error";
            version: string;
            bytesDownloaded: number;
            bytesTotal: number;
            error?: string;
          }>;
          CancelDownload: () => Promise<void>;
          InstallAndRestart: () => Promise<void>;
        };
      };
    };
  }
}

export {};
