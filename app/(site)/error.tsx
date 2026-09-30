"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/page-primitives";
import { ErrorState } from "@/components/shared/states";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-20">
      <ErrorState
        title="We couldn't load this page"
        description="Please try again. If the problem continues, message the seller directly."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </Container>
  );
}
