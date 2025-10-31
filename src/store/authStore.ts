// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginAPI } from '../api';

export type Role = "admin" | "editor" | "viewer";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  login: (userData) => any;
  logout: () => void;
  setRole: (role: Role) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, // ⬅️ important change

      login: async (userData) => {
        const res = await loginAPI(userData);
        set({ user: res.data.user });
        return res.data;
      },
      logout: () => set({ user: null }),

      setRole: (role) => {
        const current = get().user;
        if (current) set({ user: { ...current, role } });
      },
    }),
    { name: "auth-store" }
  )
);

