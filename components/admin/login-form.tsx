"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { getSession, login, SAMPLE_CREDENTIALS } from "@/services/auth";
import { getBestSellers } from "@/services/products";
import { useAsync } from "@/lib/hooks/use-async";
import { Logo } from "@/components/layout/brand";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/site/product-image";

/** Product lineup for the side panel: real packshots, staggered on a soft backdrop. */
function ProductLineup() {
  const { data } = useAsync(() => getBestSellers(6), []);
  const items = (data ?? []).filter((p) => p.images?.[0]).slice(0, 6);
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((p, i) => (
        <div
          key={p.id}
          className={i % 2 ? "translate-y-6" : undefined}
        >
          <div className="overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-black/5">
            <ProductImage src={p.images?.[0]} visual={p.visual} tone={p.tone} name={p.name} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Only allow redirects back into the admin area. */
function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/admin") ? next : "/admin/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (getSession()) router.replace(safeNext());
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(safeNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo subtitle={false} />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Back to store
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="text-xs font-medium tracking-[0.18em] text-leaf uppercase">SalesLoop seller dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-medium">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage leads, conversations, and orders.</p>

          <form onSubmit={submit} noValidate className="mt-8 grid gap-4">
            <FormField id="login-email" label="Email">
              {(p) => (
                <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              )}
            </FormField>
            <FormField id="login-password" label="Password" error={error}>
              {(p) => (
                <div className="relative">
                  <Input {...p} type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </FormField>
            <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-dashed bg-muted/40 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <KeyRound className="size-4 text-primary" aria-hidden /> Sample credentials
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
              <dt>Email</dt>
              <dd className="font-mono text-foreground select-all">{SAMPLE_CREDENTIALS.email}</dd>
              <dt>Password</dt>
              <dd className="font-mono text-foreground select-all">{SAMPLE_CREDENTIALS.password}</dd>
            </dl>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setEmail(SAMPLE_CREDENTIALS.email);
                setPassword(SAMPLE_CREDENTIALS.password);
                setError(undefined);
              }}
            >
              Fill in for me
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">Demo only. No real authentication runs in this frontend build.</p>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-sage/60 via-cream to-leaf/30 px-12 lg:flex">
        <div className="mx-auto w-full max-w-xl">
          <ProductLineup />
          <p className="mt-16 font-display text-3xl leading-snug text-forest italic text-balance">
            Every customer message, one calm place to follow up.
          </p>
        </div>
      </div>
    </div>
  );
}
