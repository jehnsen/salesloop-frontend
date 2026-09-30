/**
 * Static seed data. Components should read data through `/services`, not from here.
 * The exceptions are static, non-editable content (site config for layout chrome,
 * categories) that server components render directly.
 */
export { categories, featuredCategoryGroups } from "./categories";
export { siteConfig } from "./site";
export { blogPosts, testimonials, storeFaqs } from "./content";
