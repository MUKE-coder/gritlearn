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
        };
      };
    };
  }
}

export {};
