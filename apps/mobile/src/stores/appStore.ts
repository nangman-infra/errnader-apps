import { create } from 'zustand';

interface AppState {
  isWebViewReady: boolean;
  setWebViewReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isWebViewReady: false,
  setWebViewReady: (ready) => set({ isWebViewReady: ready }),
}));
