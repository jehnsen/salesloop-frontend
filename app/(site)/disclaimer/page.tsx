import type { Metadata } from "next";
import { MEDICAL_ADVICE_NOTICE } from "@/lib/constants";
import { siteConfig } from "@/lib/mock-data/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  const d = siteConfig.disclaimers;
  return (
    <LegalPage
      title="Disclaimer"
      description="Important information about the seller, the products, and the AI assistant."
      updated="September 1, 2026"
      sections={[
        { heading: "Independent seller", body: [d.independentSeller] },
        {
          heading: "Health and product information",
          body: [
            d.health,
            "Food supplements are not medicines and have no approved therapeutic claims. Do not use them as a replacement for prescribed treatment.",
            MEDICAL_ADVICE_NOTICE,
          ],
        },
        { heading: "AI-generated information", body: [d.ai, "The assistant never provides medical advice and will refer health-related questions to a professional and to the seller."] },
        { heading: "Prices", body: [d.pricing] },
        {
          heading: "Testimonials",
          body: ["Customer feedback reflects individual experiences with service and taste. It is not a claim about health outcomes, and results vary."],
        },
      ]}
    />
  );
}
