import type { Metadata } from "next";
import type { StoreFAQ } from "@/types";
import { getStoreFaqs } from "@/services/blog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Container, PageHero } from "@/components/layout/page-primitives";
import { AskAIButton } from "@/components/chat/ask-ai-button";

export const metadata: Metadata = { title: "FAQ", description: "Answers about ordering, delivery, payment, products, and the AI assistant." };

const GROUPS: StoreFAQ["group"][] = ["Ordering", "Delivery & Payment", "Products", "AI Assistant"];

export default async function FaqPage() {
  const faqs = await getStoreFaqs();
  return (
    <>
      <PageHero eyebrow="Help" title="Frequently asked questions" description="Can't find your answer? Ask the AI assistant or message the seller." />
      <Container className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="FAQ sections" className="hidden lg:block">
          <ul className="sticky top-24 grid gap-1 text-sm">
            {GROUPS.map((g) => (
              <li key={g}>
                <a href={`#${g.replace(/\W+/g, "-").toLowerCase()}`} className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  {g}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl space-y-10">
          {GROUPS.map((group) => (
            <section key={group} id={group.replace(/\W+/g, "-").toLowerCase()} className="scroll-mt-24 space-y-3">
              <h2 className="font-display text-2xl font-medium">{group}</h2>
              <Accordion type="multiple" className="rounded-2xl border bg-card px-5">
                {faqs
                  .filter((f) => f.group === group)
                  .map((f) => (
                    <AccordionItem key={f.question} value={f.question}>
                      <AccordionTrigger>{f.question}</AccordionTrigger>
                      <AccordionContent>{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </section>
          ))}
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-cream p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">Still have questions?</p>
            <AskAIButton>Ask the AI Assistant</AskAIButton>
          </div>
        </div>
      </Container>
    </>
  );
}
