import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  rating: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (payload: { user: AuthUser; token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: ({ user, token }) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

export const getAuthToken = (): string | null => useAuthStore.getState().token;

