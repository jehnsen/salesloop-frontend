import { getBestSellers } from "@/services/products";
import { getBlogPosts, getHeroSlides, getTestimonials } from "@/services/blog";
import { Container } from "@/components/layout/page-primitives";
import { AIPreview } from "@/components/site/ai-preview";
import { HomeHero } from "@/components/site/home-hero";
import {
  BestSellers,
  FeaturedCategories,
  FinalCTA,
  HowOrderingWorks,
  LatestArticles,
  Testimonials,
  WhyShopWithUs,
} from "@/components/site/home-sections";

export default async function HomePage() {
  const [bestSellers, posts, testimonials, heroSlides] = await Promise.all([
    getBestSellers(6),
    getBlogPosts(3),
    getTestimonials(),
    getHeroSlides(),
  ]);

  return (
    <>
      <HomeHero slides={heroSlides} />
      <FeaturedCategories />
      <BestSellers products={bestSellers} />
      <WhyShopWithUs />
      <section className="py-16">
        <Container>
          <AIPreview />
        </Container>
      </section>
      <HowOrderingWorks />
      <Testimonials testimonials={testimonials} />
      <LatestArticles posts={posts} />
      <FinalCTA />
    </>
  );
}
