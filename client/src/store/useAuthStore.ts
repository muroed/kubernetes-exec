import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      showAuthModal: false,
      setShowAuthModal: (show) => set({ showAuthModal: show }),
      login: (user) => set({ isAuthenticated: true, user, showAuthModal: false }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'kubecli-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);
