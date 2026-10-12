import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Seller login",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
