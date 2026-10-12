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
      className={cn("group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-[box-shadow,border-color] duration-300 hover:border-primary/25 hover:shadow-lift", className)}
    >
      <div className="overflow-hidden"><ProductImage src={category.image} fit="cover" visual={category.visual} tone={category.tone} name={category.shortName} angle={1} className="aspect-[5/4] transition-transform duration-500 group-hover:scale-105" /></div>
      <div className="flex flex-1 items-start justify-between gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-medium">{title ?? category.name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description ?? category.description}</p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white"><ArrowUpRight className="size-4" aria-hidden /></span>
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
      <ProductImage src={post.image} fit="cover" visual={visual} tone={post.tone} name={post.category} angle={1} className="absolute inset-0 aspect-auto h-full" />
    </div>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <Quote className="size-8 text-primary/40" strokeWidth={1.3} aria-hidden />
      <blockquote className="flex-1 text-[15px] leading-relaxed text-pretty">“{testimonial.quote}”</blockquote>
      <figcaption className="border-t pt-4 text-sm">
        <span className="font-semibold">{testimonial.name}</span>
        <span className="text-muted-foreground"> · {testimonial.location}</span>
      </figcaption>
    </figure>
  );
}
