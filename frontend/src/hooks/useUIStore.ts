import { create } from "zustand";

interface UIState {
  isCommandPaletteOpen: boolean;
  initialCommandId: string | null;
  initialParams: Record<string, string>;
  openCommandPalette: (commandId?: string, params?: Record<string, string>) => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  initialCommandId: null,
  initialParams: {},
  openCommandPalette: (commandId, params) =>
    set({
      isCommandPaletteOpen: true,
      initialCommandId: commandId || null,
      initialParams: params || {},
    }),
  closeCommandPalette: () =>
    set({
      isCommandPaletteOpen: false,
      initialCommandId: null,
      initialParams: {},
    }),
}));
