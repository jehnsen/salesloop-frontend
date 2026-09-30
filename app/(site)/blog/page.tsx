import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getBlogPosts } from "@/services/blog";
import { formatDate } from "@/lib/utils";
import { Container, PageHero } from "@/components/layout/page-primitives";
import { BlogCard, BlogCover } from "@/components/site/cards";

export const metadata: Metadata = {
  title: "Learn",
  description: "Practical guides on choosing, preparing, and storing everyday coffee, beverages, and wellness products.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Guides, tips & product education"
        description="Simple, practical reads about the products we carry, with no exaggerated claims."
      />
      <Container className="space-y-12 py-12">
        {featured && (
          <article className="group grid overflow-hidden rounded-3xl border bg-card shadow-soft md:grid-cols-2">
            <Link href={`/blog/${featured.slug}`} tabIndex={-1} aria-hidden>
              <BlogCover post={featured} className="aspect-[16/10] h-full md:aspect-auto md:min-h-80" />
            </Link>
            <div className="flex flex-col justify-center gap-3 p-6 sm:p-10">
              <p className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase">Featured · {featured.category}</p>
              <h2 className="font-display text-3xl font-medium tracking-tight text-balance">
                <Link href={`/blog/${featured.slug}`} className="hover:text-primary">
                  {featured.title}
                </Link>
              </h2>
              <p className="text-muted-foreground">{featured.excerpt}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                {featured.author} · <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time> ·
                <Clock className="size-3.5" aria-hidden /> {featured.readingMinutes} min
              </p>
            </div>
          </article>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>
    </>
  );
}
