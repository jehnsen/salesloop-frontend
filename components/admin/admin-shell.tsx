"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { getNavCounts, type NavCounts } from "@/services/notifications";
import { useDbChange } from "@/lib/hooks/use-async";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [counts, setCounts] = React.useState<NavCounts>();
  const [dataVersion, setDataVersion] = React.useState(0);

  const loadCounts = React.useCallback(() => void getNavCounts().then(setCounts), []);
  React.useEffect(loadCounts, [loadCounts, pathname]);
  useDbChange(loadCounts);

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <DashboardSidebar counts={counts} />
      </aside>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 border-none p-0" hideClose aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DashboardSidebar counts={counts} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardHeader onOpenMenu={() => setMenuOpen(true)} onDataReset={() => setDataVersion((v) => v + 1)} />
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <React.Fragment key={dataVersion}>{children}</React.Fragment>
        </main>
      </div>
    </div>
  );
}
