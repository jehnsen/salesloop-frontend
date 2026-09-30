import Link from "next/link";
import { ArrowUpRight, Clock, Quote } from "lucide-react";
import type { BlogPost, ProductCategory, Testimonial } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { ProductImage } from "./product-image";

export function CategoryCard({
  category,
  title,
  description,
  className,
}: {
  category: ProductCategory;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn("group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift", className)}
    >
      <ProductImage visual={category.visual} tone={category.tone} name={category.shortName} angle={1} className="aspect-[5/4]" />
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-medium">{title ?? category.name}</h3>
          <p className="text-sm text-muted-foreground">{description ?? category.description}</p>
        </div>
        <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" aria-hidden />
      </div>
    </Link>
  );
}

export function BlogCard({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift", className)}>
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden>
        <BlogCover post={post} className="aspect-[16/9]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-medium tracking-wide text-leaf uppercase">{post.category}</p>
        <h3 className="font-display text-xl leading-snug font-medium text-balance">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        <p className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <Clock className="size-3" aria-hidden /> {post.readingMinutes} min read
        </p>
      </div>
    </article>
  );
}

/** Editorial cover placeholder: toned backdrop with the category. */
export function BlogCover({ post, className }: { post: BlogPost; className?: string }) {
  const visual = post.category === "Recipes" || post.category === "Coffee Guides" ? "coffee" : post.category === "Lifestyle" ? "tea" : "jar";
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <ProductImage visual={visual} tone={post.tone} name={post.category} angle={1} className="absolute inset-0 aspect-auto h-full" />
    </div>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-soft">
      <Quote className="size-6 text-clay" aria-hidden />
      <blockquote className="flex-1 text-[15px] leading-relaxed text-pretty">“{testimonial.quote}”</blockquote>
      <figcaption className="text-sm">
        <span className="font-semibold">{testimonial.name}</span>
        <span className="text-muted-foreground"> · {testimonial.location}</span>
      </figcaption>
    </figure>
  );
}
