// src/store/authStore.ts
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
    (set, get) => ({
      user: null, // ⬅️ important change

      login: (userData) => set({ user: userData }),

      logout: () => set({ user: null }),

      setRole: (role) => {
        const current = get().user;
        if (current) set({ user: { ...current, role } });
      },
    }),
    { name: "auth-store" }
  )
);

