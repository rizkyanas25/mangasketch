import { create } from 'zustand';

export type ToastType = 'recovered' | 'deleted' | 'success' | 'error';

export interface ToastState {
  type: ToastType;
  message: string;
  visible: boolean;
}

interface UiState {
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
  toast: ToastState | null;
  showToast: (
    type: ToastType,
    message: string,
    triggerJiggle?: boolean,
    duration?: number,
  ) => void;
  hideToast: () => void;
  isJiggling: boolean;
  setIsJiggling: (jiggle: boolean) => void;
}

let toastTimer: NodeJS.Timeout | null = null;
let jiggleTimer: NodeJS.Timeout | null = null;

export const useUiStore = create<UiState>((set) => ({
  isGenerating: false,
  setIsGenerating: (loading) => set({ isGenerating: loading }),
  toast: null,
  isJiggling: false,
  showToast: (type, message, triggerJiggle = false, duration = 4000) => {
    if (toastTimer) clearTimeout(toastTimer);
    if (jiggleTimer) clearTimeout(jiggleTimer);

    set({
      toast: { type, message, visible: true },
      isJiggling: triggerJiggle,
    });

    // Hide toast after custom duration
    toastTimer = setTimeout(() => {
      set((state) => {
        if (state.toast) {
          return { toast: { ...state.toast, visible: false } };
        }
        return {};
      });

      // Completely remove toast after transition animation completes (300ms)
      toastTimer = setTimeout(() => {
        set({ toast: null });
      }, 300);
    }, duration);

    // Stop jiggling after custom duration to match toast visibility duration
    if (triggerJiggle) {
      jiggleTimer = setTimeout(() => {
        set({ isJiggling: false });
      }, duration);
    }
  },
  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    if (jiggleTimer) clearTimeout(jiggleTimer);

    set((state) => {
      if (state.toast) {
        return { toast: { ...state.toast, visible: false } };
      }
      return {};
    });

    setTimeout(() => {
      set({ toast: null, isJiggling: false });
    }, 300);
  },
  setIsJiggling: (jiggle) => set({ isJiggling: jiggle }),
}));
