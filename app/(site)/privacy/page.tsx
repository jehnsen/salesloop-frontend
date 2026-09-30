import type { Metadata } from "next";
import { siteConfig } from "@/lib/mock-data/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How we collect and use your information when you browse, chat, or send an inquiry."
      updated="September 1, 2026"
      sections={[
        {
          heading: "Information we collect",
          body: [
            "When you send an order inquiry, contact form, or share details in the chat, we collect your name, mobile number, and optionally your email, Messenger name, and city or municipality.",
            "Chat messages with the AI assistant are stored so the seller can follow up on your questions.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "Only to respond to your inquiry, confirm and deliver orders, and send follow-ups you would reasonably expect (for example, a reorder reminder). We do not sell your information.",
            "Promotional messages require the seller's approval and you can opt out anytime by replying STOP.",
          ],
        },
        {
          heading: "AI assistant",
          body: [
            "The AI assistant analyzes your messages to understand what product you're interested in and how to help. This analysis is visible only to the seller.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            `Under the Philippine Data Privacy Act of 2012, you may request access to, correction of, or deletion of your personal data. Contact ${siteConfig.contact.email}.`,
          ],
        },
      ]}
    />
  );
}
