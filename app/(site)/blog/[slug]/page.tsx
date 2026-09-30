import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Lightbulb } from "lucide-react";
import { blogPosts } from "@/lib/mock-data/content";
import { siteConfig } from "@/lib/mock-data/site";
import { getBlogPostBySlug, getRelatedPosts } from "@/services/blog";
import { getProductsBySlugs } from "@/services/products";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { AskAIButton } from "@/components/chat/ask-ai-button";
import { Breadcrumbs, Container, SectionHeader } from "@/components/layout/page-primitives";
import { BlogCard, BlogCover } from "@/components/site/cards";
import { ProductGrid } from "@/components/site/product-card";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getBlogPostBySlug((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "Article not found" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  const [related, products] = await Promise.all([getRelatedPosts(slug, 3), getProductsBySlugs(post.relatedProductSlugs)]);

  return (
    <>
      <article>
        <Container className="max-w-3xl space-y-6 pt-8 pb-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Learn", href: "/blog" }, { label: post.title }]} />
          <p className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase">{post.category}</p>
          <h1 className="font-display text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">{post.title}</h1>
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="flex items-center gap-3 text-sm">
            <Avatar name={post.author} />
            <div>
              <p className="font-medium">{post.author}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, { dateStyle: "long" })}</time> ·
                <Clock className="size-3.5" aria-hidden /> {post.readingMinutes} min read
              </p>
            </div>
          </div>
        </Container>
        <Container className="max-w-5xl">
          <BlogCover post={post} className="aspect-[16/8] rounded-3xl" />
        </Container>
        <Container className="max-w-3xl space-y-5 py-10 text-[17px] leading-relaxed">
          {post.content.map((block, i) => {
            switch (block.type) {
              case "h2":
                return (
                  <h2 key={i} className="pt-4 font-display text-2xl font-medium tracking-tight">
                    {block.text}
                  </h2>
                );
              case "list":
                return (
                  <ul key={i} className="grid list-disc gap-2 pl-6 marker:text-leaf">
                    {block.items?.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                );
              case "note":
                return (
                  <aside key={i} className="flex gap-3 rounded-2xl border bg-primary-soft/50 p-5 text-base">
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-leaf" aria-hidden />
                    <p>{block.text}</p>
                  </aside>
                );
              default:
                return (
                  <p key={i} className="text-foreground/90">
                    {block.text}
                  </p>
                );
            }
          })}
          <p className="border-t pt-6 text-sm text-muted-foreground">{siteConfig.disclaimers.health}</p>
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-cream p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">Have a question about this topic?</p>
            <AskAIButton prompt={post.relatedProductSlugs.length > 1 ? "Compare products" : undefined}>Ask the AI Assistant</AskAIButton>
          </div>
        </Container>
      </article>

      {products.length > 0 && (
        <Container className="space-y-8 py-10">
          <SectionHeader title="Products in this article" />
          <ProductGrid products={products} className="xl:grid-cols-3" />
        </Container>
      )}

      <Container className="space-y-8 py-10">
        <SectionHeader title="Related articles" />
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
      </Container>
    </>
  );
}
