import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
        <Leaf className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-medium">Page not found</h1>
        <p className="max-w-md text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    </main>
  );
}
