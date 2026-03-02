import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  icon?: string;
  type?: 'success' | 'warning' | 'error';
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, icon?: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, icon, type) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, icon, type }],
    }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
