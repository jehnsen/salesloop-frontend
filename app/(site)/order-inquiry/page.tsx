import type { Metadata } from "next";
import { getAllProducts } from "@/services/products";
import { Container, PageHero } from "@/components/layout/page-primitives";
import { OrderInquiryForm } from "@/components/site/order-inquiry-form";

export const metadata: Metadata = {
  title: "Order Inquiry",
  description: "Send an order inquiry. The seller confirms availability, total amount, payment, and delivery.",
};

export default async function OrderInquiryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const products = await getAllProducts();
  const productSlug = str("product");
  const qty = Number(str("qty"));

  return (
    <>
      <PageHero
        eyebrow="Order inquiry"
        title="Tell us what you'd like"
        description="Send a quick inquiry and the seller will get back to you to confirm availability, total, payment, and delivery."
      />
      <Container className="py-10">
        <OrderInquiryForm
          products={products}
          defaults={{
            productSlug: products.some((p) => p.slug === productSlug) ? productSlug : undefined,
            quantity: Number.isFinite(qty) && qty > 0 ? Math.min(qty, 99) : 1,
            location: str("location"),
            fullName: str("name"),
            mobile: str("mobile"),
            fromChat: str("source") === "chat",
          }}
        />
      </Container>
    </>
  );
}
