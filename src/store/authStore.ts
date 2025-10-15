// src/store/authStore.ts
import { create } from "zustand";

type UserRole = "admin" | "manager" | "viewer";

interface AuthState {
  user: { email: string; role: UserRole } | null;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (email, role = "admin") => set({ user: { email, role } }),
  logout: () => set({ user: null }),
}));

