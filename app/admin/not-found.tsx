import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";

export default function AdminNotFound() {
  return (
    <EmptyState
      className="mt-10"
      title="Page not found"
      description="This admin page doesn't exist."
      action={
        <Button asChild>
          <Link href="/admin/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
