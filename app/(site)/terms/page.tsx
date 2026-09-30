import type { Metadata } from "next";
import { siteConfig } from "@/lib/mock-data/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      description="The terms that apply when you use this website and send order inquiries."
      updated="September 1, 2026"
      sections={[
        {
          heading: "About this website",
          body: [siteConfig.disclaimers.independentSeller],
        },
        {
          heading: "Order inquiries",
          body: [
            "Submitting an order inquiry does not create a purchase. An order is only confirmed once the seller confirms availability, the total amount, payment, and delivery details with you.",
            siteConfig.disclaimers.pricing,
          ],
        },
        {
          heading: "Payments and delivery",
          body: [
            "Payment instructions are provided by the seller after confirmation. Delivery schedules and fees depend on your location and are confirmed before payment.",
          ],
        },
        {
          heading: "AI assistant",
          body: [
            "The AI assistant provides general product information based on approved product details. It may make mistakes. Confirm important details with the seller before ordering.",
          ],
        },
      ]}
    />
  );
}
