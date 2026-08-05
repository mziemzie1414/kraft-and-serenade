import { BestSellers } from "@/components/sections/BestSellers";
import { CustomerReviews } from "@/components/sections/CustomerReviews";
import { FaqSection } from "@/components/sections/FaqSection";
import { FeaturedBouquets } from "@/components/sections/FeaturedBouquets";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { InstagramGallery } from "@/components/sections/InstagramGallery";
import { Newsletter } from "@/components/sections/Newsletter";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { ShopByCategory } from "@/components/sections/ShopByCategory";
import { ShopByOccasion } from "@/components/sections/ShopByOccasion";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedBouquets />
      <BestSellers />
      <ShopByOccasion />
      <ShopByCategory />
      <WhyChooseUs />
      <HowItWorks />
      <CustomerReviews />
      <InstagramGallery />
      <PromoBanner />
      <FaqSection />
      <Newsletter />
    </>
  );
}
