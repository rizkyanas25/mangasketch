import { create } from 'zustand';

interface UiState {
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isGenerating: false,
  setIsGenerating: (loading) => set({ isGenerating: loading }),
}));
