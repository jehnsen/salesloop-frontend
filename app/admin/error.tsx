"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/states";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      className="mt-10"
      title="This page couldn't load"
      description="Something went wrong while loading your data. Your changes are safe."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
