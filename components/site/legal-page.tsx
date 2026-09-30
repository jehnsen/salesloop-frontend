import { Container, PageHero } from "@/components/layout/page-primitives";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  description,
  updated,
  sections,
}: {
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} description={description}>
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
      </PageHero>
      <Container className="max-w-3xl space-y-8 py-12">
        <p className="rounded-xl border border-warning/25 bg-warning-soft/60 p-4 text-sm">
          Template text for demonstration. Have it reviewed by a qualified professional before publishing.
        </p>
        {sections.map((s) => (
          <section key={s.heading} className="space-y-3">
            <h2 className="font-display text-2xl font-medium">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="leading-relaxed text-foreground/85">
                {p}
              </p>
            ))}
          </section>
        ))}
      </Container>
    </>
  );
}
