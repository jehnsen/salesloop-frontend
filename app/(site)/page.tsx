import { getBestSellers } from "@/services/products";
import { getBlogPosts, getTestimonials } from "@/services/blog";
import { Container } from "@/components/layout/page-primitives";
import { AIPreview } from "@/components/site/ai-preview";
import {
  BestSellers,
  FeaturedCategories,
  FinalCTA,
  HomeHero,
  HowOrderingWorks,
  LatestArticles,
  Testimonials,
  WhyShopWithUs,
} from "@/components/site/home-sections";

export default async function HomePage() {
  const [bestSellers, posts, testimonials] = await Promise.all([getBestSellers(6), getBlogPosts(3), getTestimonials()]);

  return (
    <>
      <HomeHero featured={bestSellers.slice(0, 3)} />
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
