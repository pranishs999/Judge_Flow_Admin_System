"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview", href: "/dashboard/super-admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/super-admin/users", icon: Users },
  { label: "Events", href: "/dashboard/super-admin/events", icon: CalendarCheck },
  { label: "Audit Log", href: "/dashboard/super-admin/audit", icon: ClipboardList },
  { label: "Settings", href: "/dashboard/super-admin/settings", icon: Settings },
];

export function DashboardSidebar() {
  const [pathname, setPathname] = useState("/");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border/70 bg-card/70 backdrop-blur transition-all duration-200",
        collapsed ? "w-18" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
        {!collapsed && (
          <Link href="/dashboard/super-admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">JFlow</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground",
            collapsed && "mx-auto",
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-3">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
