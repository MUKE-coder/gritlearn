import {
  Home,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

// Single source of truth for the desktop sidebar nav. Add new sections
// or items here; <Sidebar> reads this and renders grouped nav.
//
// A "section" is a logical cluster of related items (Properties,
// Operations, Admin, etc). The first section is rendered without a
// header so the dashboard / home item sits clean at the top.

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title?: string; // omit on the first section for the unbranded "main" group
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: "/app", label: "Dashboard", icon: Home },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/app/profile", label: "Profile", icon: User },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];
