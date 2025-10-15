// src/store/authStore.ts - FINAL WITH ROLE SUPPORT
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "editor" | "viewer";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  setRole: (role: Role) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: "1",
        name: "Demo Admin",
        email: "admin@example.com",
        role: "admin", // 👈 default role for testing
      },
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
      setRole: (role) =>
        set((state) =>
          state.user ? { user: { ...state.user, role } } : state
        ),
    }),
    { name: "auth-store" }
  )
);
