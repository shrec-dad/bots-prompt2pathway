// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";

// Lucide icons (already in project)
import {
  LayoutDashboard,
  Users2,
  Bot,
  Puzzle,
  BookOpen,
  Mail,
  Palette,
  Link2,
  Settings,
  BarChart3,
} from "lucide-react";

/**
 * Pick the accent theme you want for the sidebar icons and active item.
 * Choices: "red" | "blue" | "gold"
 *
 * - "red"  => Red → Orange → Yellow (high energy)
 * - "blue" => Blue → Cyan → Teal (strong tech/pro)
 * - "gold" => Amber → Yellow → Emerald (premium)
 */
const THEME: "red" | "blue" | "gold" = "blue";

// Tailwind class presets for each theme
const THEMES = {
  red: {
    active: "bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20",
    tile: "bg-gradient-to-br from-red-500/15 via-oran
