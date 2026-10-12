import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Seller Dashboard", template: "%s · SalesLoop" },
  robots: { index: false, follow: false },
};

/**
 * Seller admin. Auth is a mock localStorage session (see services/auth.ts, checked in AdminShell);
 * protect /admin with middleware once the backend provides real sessions.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
