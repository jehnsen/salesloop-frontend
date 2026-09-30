import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/page-primitives";
import { ProductGridSkeleton } from "@/components/site/product-card";

export default function Loading() {
  return (
    <Container className="space-y-6 py-12">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      <ProductGridSkeleton />
    </Container>
  );
}
