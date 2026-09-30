"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarClock,
  ExternalLink,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Package,
  PenSquare,
  Settings,
  ShoppingBag,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavCounts } from "@/services/notifications";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: (c: NavCounts) => number;
  urgent?: boolean;
}

export const ADMIN_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/leads", label: "Leads", icon: Users, badge: (c) => c.newLeads },
      { href: "/admin/conversations", label: "Conversations", icon: MessagesSquare, badge: (c) => c.conversationsNeedingSeller, urgent: true },
      { href: "/admin/follow-ups", label: "Follow-ups", icon: CalendarClock, badge: (c) => c.followUpsDue, urgent: true },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: (c) => c.newOrderInquiries },
      { href: "/admin/customers", label: "Customers", icon: UserRound },
    ],
  },
  {
    title: "Catalog & AI",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/ai-agent", label: "AI Agent", icon: Bot },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/content", label: "Content", icon: PenSquare },
      { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  { title: "Account", items: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
];

export function DashboardSidebar({ counts, onNavigate }: { counts?: NavCounts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar font-bold">S</span>
        <div className="leading-tight">
          <p className="font-semibold text-white">SalesLoop</p>
          <p className="text-[11px] text-sidebar-muted">Luntian Wellness</p>
        </div>
      </div>
      <nav aria-label="Admin" className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">{group.title}</p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const count = counts && item.badge ? item.badge(counts) : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                      )}
                    >
                      <item.icon className={cn("size-4", active && "text-sidebar-primary")} aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                            item.urgent ? "bg-[#e0735a] text-white" : "bg-sidebar-accent text-sidebar-primary",
                          )}
                          aria-label={`${count} pending`}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
        >
          <ExternalLink className="size-4" aria-hidden /> View customer site
        </Link>
      </div>
    </div>
  );
}
