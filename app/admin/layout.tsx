import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Seller Dashboard", template: "%s · SalesLoop" },
  robots: { index: false, follow: false },
};

/**
 * Seller admin. Authentication is not implemented in this frontend-only build;
 * protect /admin with middleware once the backend provides sessions.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
