/**
 * Static content for the storefront.
 *
 * This project is frontend-only: there is no database, API or auth layer.
 * Everything below is hard-coded dummy content used to render the landing page.
 */

export type Product = {
  id: string;
  name: string;
  category: string;
  /** Price in PHP, stored as a number so formatting stays in one place. */
  price: number;
  /** Optional "was" price used to render a strike-through. */
  compareAtPrice?: number;
  image: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  badge?: string;
};

export type Category = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  imageAlt: string;
  itemCount: number;
};

export type Occasion = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
  imageAlt: string;
};

export type Review = {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  avatar: string;
  purchased: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export const BRAND = {
  name: "Kraft & Serenade",
  tagline: "Hand-tied bouquets, quietly made",
  email: "hello@kraftandserenade.com",
  phone: "+63 917 555 0142",
  addressLines: ["112 Marigold Lane, Unit 4", "Barangay San Antonio", "Pasig City, Metro Manila 1600"],
  currency: "PHP",
} as const;

/**
 * Bouquet categories. These drive both the Products dropdown in the navbar and
 * the "Shop by Category" section, so the two can never drift apart.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "graduation-bouquets",
    name: "Graduation Bouquets",
    shortName: "Graduation",
    description: "Cap-and-gown ready arrangements with room for a ribbon sash.",
    image: "/images/categories/graduation-bouquets.jpg",
    imageAlt: "Graduates tossing their caps into the air at sunset",
    itemCount: 18,
  },
  {
    slug: "birthday-bouquets",
    name: "Birthday Bouquets",
    shortName: "Birthday",
    description: "Bright, playful colour stories built to make someone grin.",
    image: "/images/categories/birthday-bouquets.jpg",
    imageAlt: "Cluster of pastel birthday balloons against a ceiling",
    itemCount: 24,
  },
  {
    slug: "anniversary-bouquets",
    name: "Anniversary Bouquets",
    shortName: "Anniversary",
    description: "Romantic, layered blooms for the years worth marking.",
    image: "/images/categories/anniversary-bouquets.jpg",
    imageAlt: "Newlyweds' hands with wedding rings resting beside a bouquet",
    itemCount: 16,
  },
  {
    slug: "wedding-bouquets",
    name: "Wedding Bouquets",
    shortName: "Wedding",
    description: "Bridal, bridesmaid and ceremony florals, styled to your palette.",
    image: "/images/categories/wedding-bouquets.jpg",
    imageAlt: "Bride holding a soft bridal bouquet in warm backlight",
    itemCount: 21,
  },
  {
    slug: "sunflower-bouquets",
    name: "Sunflower Bouquets",
    shortName: "Sunflower",
    description: "Big, sunny heads that hold their cheer for over a week.",
    image: "/images/categories/sunflower-bouquets.jpg",
    imageAlt: "Bunch of bright yellow sunflowers",
    itemCount: 12,
  },
  {
    slug: "rose-bouquets",
    name: "Rose Bouquets",
    shortName: "Rose",
    description: "Garden and standard roses in blush, ivory and deep red.",
    image: "/images/categories/rose-bouquets.jpg",
    imageAlt: "Full pink garden roses in bloom",
    itemCount: 30,
  },
  {
    slug: "tulip-bouquets",
    name: "Tulip Bouquets",
    shortName: "Tulip",
    description: "Seasonal imported tulips, bunched loose and low.",
    image: "/images/categories/tulip-bouquets.jpg",
    imageAlt: "A single pink tulip against a pale pink backdrop",
    itemCount: 14,
  },
  {
    slug: "mixed-flower-bouquets",
    name: "Mixed Flower Bouquets",
    shortName: "Mixed Flower",
    description: "Florist's choice mixes using whatever is best that morning.",
    image: "/images/categories/mixed-flower-bouquets.jpg",
    imageAlt: "Moody mixed bouquet of roses, ranunculus and greenery",
    itemCount: 27,
  },
  {
    slug: "money-bouquets",
    name: "Money Bouquets",
    shortName: "Money",
    description: "Folded bills and blooms, wrapped for graduations and debuts.",
    image: "/images/categories/money-bouquets.jpg",
    imageAlt: "Assorted colourful banknotes laid out flat",
    itemCount: 9,
  },
  {
    slug: "custom-bouquets",
    name: "Custom Bouquets",
    shortName: "Custom",
    description: "Tell us the colours and the story. We build the rest.",
    image: "/images/categories/custom-bouquets.jpg",
    imageAlt: "Multicoloured roses in many dyed shades",
    itemCount: 6,
  },
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "blush-peony-serenade",
    name: "Blush Peony Serenade",
    category: "Mixed Flower Bouquets",
    price: 2480,
    compareAtPrice: 2900,
    image: "/images/products/blush-peony-serenade.jpg",
    imageAlt: "Pale pink and white roses arranged in a clear glass vase",
    rating: 4.9,
    reviewCount: 128,
    badge: "Best value",
  },
  {
    id: "garden-rose-embrace",
    name: "Garden Rose Embrace",
    category: "Rose Bouquets",
    price: 3150,
    image: "/images/products/garden-rose-embrace.jpg",
    imageAlt: "Dense cluster of open pink garden roses",
    rating: 4.8,
    reviewCount: 96,
  },
  {
    id: "sunlit-sunflower-cheer",
    name: "Sunlit Sunflower Cheer",
    category: "Sunflower Bouquets",
    price: 1890,
    image: "/images/products/sunlit-sunflower-cheer.jpg",
    imageAlt: "Armful of bright yellow sunflowers",
    rating: 4.7,
    reviewCount: 74,
    badge: "New",
  },
  {
    id: "tulip-whisper",
    name: "Tulip Whisper",
    category: "Tulip Bouquets",
    price: 2650,
    image: "/images/products/tulip-whisper.jpg",
    imageAlt: "Pink tulips gathered in a glass jar tied with ribbon",
    rating: 4.9,
    reviewCount: 61,
  },
  {
    id: "midnight-garden-mix",
    name: "Midnight Garden Mix",
    category: "Mixed Flower Bouquets",
    price: 3420,
    image: "/images/products/midnight-garden-mix.jpg",
    imageAlt: "Deep-toned bouquet of roses and ranunculus on a dark background",
    rating: 4.8,
    reviewCount: 53,
  },
  {
    id: "coral-sunset-vase",
    name: "Coral Sunset in Vase",
    category: "Birthday Bouquets",
    price: 2980,
    compareAtPrice: 3300,
    image: "/images/products/coral-sunset-vase.jpg",
    imageAlt: "Coral and orange bouquet arranged in a small vase",
    rating: 4.6,
    reviewCount: 88,
  },
  {
    id: "pearl-white-rose",
    name: "Pearl White Rose",
    category: "Rose Bouquets",
    price: 1450,
    image: "/images/products/pearl-white-rose.jpg",
    imageAlt: "Single white rose resting on a weathered wooden surface",
    rating: 4.7,
    reviewCount: 42,
  },
  {
    id: "hydrangea-dream",
    name: "Hydrangea Dream",
    category: "Mixed Flower Bouquets",
    price: 2740,
    image: "/images/products/hydrangea-dream.jpg",
    imageAlt: "Blue and violet hydrangea heads clustered together",
    rating: 4.8,
    reviewCount: 67,
  },
];

export const BEST_SELLERS: Product[] = [
  {
    id: "ivory-eucalyptus-bridal",
    name: "Ivory & Eucalyptus Bridal",
    category: "Wedding Bouquets",
    price: 4250,
    image: "/images/products/ivory-eucalyptus-bridal.jpg",
    imageAlt: "Ivory roses with eucalyptus in a bridal bouquet",
    rating: 5.0,
    reviewCount: 214,
    badge: "#1 best seller",
  },
  {
    id: "rainbow-celebration",
    name: "Rainbow Celebration",
    category: "Custom Bouquets",
    price: 3680,
    compareAtPrice: 4100,
    image: "/images/products/rainbow-celebration.jpg",
    imageAlt: "Roses dyed in many bright rainbow shades",
    rating: 4.9,
    reviewCount: 187,
  },
  {
    id: "peach-dahlia-glow",
    name: "Peach Dahlia Glow",
    category: "Anniversary Bouquets",
    price: 3290,
    image: "/images/products/peach-dahlia-glow.jpg",
    imageAlt: "Peach and cream dahlias in soft daylight",
    rating: 4.8,
    reviewCount: 156,
  },
  {
    id: "single-stem-rose",
    name: "Single Stem, Long Story",
    category: "Rose Bouquets",
    price: 890,
    image: "/images/products/single-stem-rose.jpg",
    imageAlt: "One pink rose standing in a slim glass vase",
    rating: 4.7,
    reviewCount: 143,
    badge: "Under ₱1,000",
  },
];

export const OCCASIONS: Occasion[] = [
  {
    slug: "graduation",
    name: "Graduation",
    blurb: "Sashes, ribbons and money folds",
    image: "/images/occasions/graduation.jpg",
    imageAlt: "A graduation cap held up against a building facade",
  },
  {
    slug: "birthday",
    name: "Birthday",
    blurb: "Loud colour, zero subtlety",
    image: "/images/occasions/birthday.jpg",
    imageAlt: "Sliced rainbow layer cake on a blue cake stand",
  },
  {
    slug: "anniversary",
    name: "Anniversary",
    blurb: "Soft, romantic, considered",
    image: "/images/occasions/anniversary.jpg",
    imageAlt: "Hands holding a heart-shaped arrangement of flowers",
  },
  {
    slug: "wedding",
    name: "Weddings",
    blurb: "Bridal party to reception table",
    image: "/images/occasions/wedding.jpg",
    imageAlt: "Newlyweds kissing as guests throw confetti",
  },
  {
    slug: "congratulations",
    name: "Congratulations",
    blurb: "New job, new home, new chapter",
    image: "/images/occasions/congratulations.jpg",
    imageAlt: "Crowd releasing balloons at a celebration",
  },
  {
    slug: "just-because",
    name: "Just Because",
    blurb: "The best reason there is",
    image: "/images/occasions/just-because.jpg",
    imageAlt: "White tulips arranged in a ceramic vase on a wooden bench",
  },
];

export const GALLERY_IMAGES = [
  { src: "/images/gallery/gallery-01.jpg", alt: "Field of red poppies in soft light", caption: "Field poppies, June" },
  { src: "/images/gallery/gallery-02.jpg", alt: "Yellow poppies against a blue sky", caption: "Golden hour blooms" },
  { src: "/images/gallery/gallery-03.jpg", alt: "Pale blue roses photographed at dusk", caption: "Dusk roses" },
  { src: "/images/gallery/gallery-04.jpg", alt: "Mass of red begonia flowers", caption: "Red on red" },
  { src: "/images/gallery/gallery-05.jpg", alt: "Cherry blossom branches in bloom", caption: "Blossom season" },
  { src: "/images/gallery/gallery-06.jpg", alt: "Gifts wrapped in red and white paper", caption: "Gift notes in every order" },
  { src: "/images/gallery/gallery-07.jpg", alt: "Potting scoop, soil and shears on a work surface", caption: "Bench, 6am" },
  { src: "/images/gallery/gallery-08.jpg", alt: "Flower shop display filled with fresh stems", caption: "Marigold Lane studio" },
] as const;

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Mara Villanueva",
    location: "Quezon City",
    rating: 5,
    quote:
      "Ordered a graduation bouquet the night before and it still arrived by 9am. The money fold was neater than anything I could have done myself.",
    avatar: "/images/reviews/avatar-01.jpg",
    purchased: "Graduation Bouquet",
  },
  {
    id: "r2",
    name: "Dan Escobar",
    location: "Makati",
    rating: 5,
    quote:
      "I asked for something that did not look like a standard anniversary bouquet and they nailed it. Deep reds, almost black foliage. My wife kept it for two weeks.",
    avatar: "/images/reviews/avatar-02.jpg",
    purchased: "Midnight Garden Mix",
  },
  {
    id: "r3",
    name: "Chelsea Ong",
    location: "Pasig",
    rating: 4,
    quote:
      "Beautiful tulips and genuinely fresh. Delivery window was a little wide, but the courier called ahead which I appreciated.",
    avatar: "/images/reviews/avatar-03.jpg",
    purchased: "Tulip Whisper",
  },
  {
    id: "r4",
    name: "Miguel Santos",
    location: "Mandaluyong",
    rating: 5,
    quote:
      "Used them for our wedding. They sent a mock-up photo three days before so we could adjust the palette. Very easy to work with.",
    avatar: "/images/reviews/avatar-04.jpg",
    purchased: "Ivory & Eucalyptus Bridal",
  },
  {
    id: "r5",
    name: "Alyssa Reyes",
    location: "San Juan",
    rating: 5,
    quote:
      "The single stem rose is my go-to for small apologies and small victories. Wrapped properly every single time.",
    avatar: "/images/reviews/avatar-05.jpg",
    purchased: "Single Stem, Long Story",
  },
];

export const FAQS: Faq[] = [
  {
    id: "faq-delivery-areas",
    question: "Where do you deliver?",
    answer:
      "We deliver across Metro Manila daily, and to Rizal, Cavite, Laguna and Bulacan on scheduled runs. Anything outside those areas is quoted per order, so message us with the address first.",
  },
  {
    id: "faq-same-day",
    question: "Can I order for same-day delivery?",
    answer:
      "Yes, for orders placed before 1:00 PM on the day itself, subject to what is on the bench that morning. After the cut-off we will book you into the first slot the next day rather than send something we are not happy with.",
  },
  {
    id: "faq-freshness",
    question: "How long will the flowers last?",
    answer:
      "Expect five to nine days depending on the variety and your room temperature. Every bouquet ships with a care card, and trimming 1cm off the stems with a fresh water change every other day makes the biggest difference.",
  },
  {
    id: "faq-custom",
    question: "Can I request a custom bouquet?",
    answer:
      "That is most of what we do. Send us a palette, a budget and the occasion. We will reply with a proposed stem list and a mock-up photo before anything is cut.",
  },
  {
    id: "faq-money-bouquets",
    question: "How do money bouquets work?",
    answer:
      "You choose the bouquet size and provide the bills, or we can source clean bills for an added handling fee. We fold and mount them ourselves so nothing is taped directly to the cash.",
  },
  {
    id: "faq-substitutions",
    question: "What if a flower I picked is unavailable?",
    answer:
      "Flowers are seasonal, so we substitute like for like in colour and weight and message you before dispatch. If the swap does not sit right with you, we will cancel and refund in full.",
  },
  {
    id: "faq-cancellations",
    question: "What is your cancellation policy?",
    answer:
      "Cancel free of charge up to 24 hours before your delivery window. Inside 24 hours we have usually already bought and conditioned your stems, so we can offer store credit instead.",
  },
];

export const WHY_CHOOSE_US = [
  {
    id: "market-fresh",
    title: "Cut this morning, not last week",
    body: "We buy at the Dangwa market at 4am and only build with what passed inspection. Anything we would not keep ourselves does not go out.",
  },
  {
    id: "florist-made",
    title: "Made by one of four florists",
    body: "No assembly line. A named florist builds your bouquet start to finish and signs the care card that ships with it.",
  },
  {
    id: "mockups",
    title: "You see it before we cut it",
    body: "For custom and event work we send a mock-up photo for approval, so there are no surprises on the doorstep.",
  },
  {
    id: "careful-delivery",
    title: "Delivered upright, in water",
    body: "Bouquets travel in weighted, water-filled carriers with our own riders inside Metro Manila. No bouquet lies flat in a trunk.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick a bouquet or a palette",
    body: "Start from a ready-made design, or just tell us the colours and the feeling you are after.",
  },
  {
    step: "02",
    title: "Add the details",
    body: "Choose the size, the wrap, and write your gift note. Money folds and ribbon sashes get added here.",
  },
  {
    step: "03",
    title: "Approve the mock-up",
    body: "Custom orders get a photo of the build for sign-off. Ready-made designs skip straight to the bench.",
  },
  {
    step: "04",
    title: "We deliver it upright",
    body: "Your bouquet leaves in water and arrives in a window you choose, with a photo sent on hand-off.",
  },
] as const;

export const BUSINESS_HOURS = [
  { days: "Monday – Friday", hours: "8:00 AM – 7:00 PM" },
  { days: "Saturday", hours: "8:00 AM – 8:00 PM" },
  { days: "Sunday", hours: "9:00 AM – 5:00 PM" },
  { days: "Public holidays", hours: "10:00 AM – 4:00 PM" },
] as const;

/** Formats a PHP amount without relying on locale data being present at runtime. */
export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
