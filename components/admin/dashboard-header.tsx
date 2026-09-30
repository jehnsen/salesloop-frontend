"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, RotateCcw, Search, Settings, Store } from "lucide-react";
import { toast } from "sonner";
import { getNotifications, globalSearch, type AppNotification, type SearchResult } from "@/services/notifications";
import { resetDemoData } from "@/services/settings";
import { siteConfig } from "@/lib/mock-data/site";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function DashboardHeader({ onOpenMenu, onDataReset }: { onOpenMenu: () => void; onDataReset: () => void }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-10 w-full max-w-md min-w-0 items-center gap-2 rounded-full border bg-card px-3.5 text-sm text-muted-foreground transition-colors hover:border-input"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 truncate text-left">Search leads, customers, orders…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] sm:inline">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <NotificationsMenu />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted" aria-label="Account menu">
            <Avatar name={siteConfig.seller.name} className="size-8" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium text-foreground">{siteConfig.seller.name}</span>
              <span className="block font-normal">{siteConfig.seller.role}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings"><Settings /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank"><Store /> View store</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setResetOpen(true)}>
              <RotateCcw /> Reset demo data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="This clears every lead, order, and change made in this browser and restores the original sample data."
        confirmLabel="Reset data"
        destructive
        onConfirm={async () => {
          await resetDemoData();
          onDataReset();
          toast.success("Demo data restored");
        }}
      />
    </header>
  );
}

function NotificationsMenu() {
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [seen, setSeen] = React.useState<Set<string>>(new Set());
  const load = React.useCallback(() => getNotifications().then(setItems), []);

  React.useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener("salesloop:db-change", handler);
    return () => window.removeEventListener("salesloop:db-change", handler);
  }, [load]);

  const unread = items.filter((i) => !seen.has(i.id)).length;

  return (
    <DropdownMenu onOpenChange={(open) => open && void load()}>
      <DropdownMenuTrigger className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setSeen(new Set(items.map((i) => i.id)))}>
            Mark all read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>}
          {items.map((n) => (
            <DropdownMenuItem key={n.id} asChild className="items-start">
              <Link href={n.href} onClick={() => setSeen((s) => new Set(s).add(n.id))}>
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    seen.has(n.id) ? "bg-transparent" : n.tone === "urgent" ? "bg-destructive" : n.tone === "success" ? "bg-success" : "bg-info",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.description}</span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.timestamp)}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
    let cancelled = false;
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      globalSearch(term).then((r) => {
        if (cancelled) return;
        setResults(r);
        setActive(0);
        setLoading(false);
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term]);

  const go = (r: SearchResult) => {
    onOpenChange(false);
    router.push(r.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] max-w-xl translate-y-0 gap-0 p-0" hideClose aria-describedby={undefined}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1));
              if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
              if (e.key === "Enter" && results[active]) go(results[active]);
            }}
            placeholder="Search by name, mobile, order number, or product"
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {term.trim().length < 2 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</li>}
          {term.trim().length >= 2 && !loading && results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results for “{term}”.</li>
          )}
          {results.map((r, i) => (
            <li key={`${r.type}-${r.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left", i === active && "bg-muted")}
              >
                <span className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground uppercase">{r.type}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
