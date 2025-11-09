import type { TeslaGlobalContract } from "./src/TeslaThemeProvider";

declare global {
  interface Window {
    tesla?: TeslaGlobalContract;
  }
}

export {};
