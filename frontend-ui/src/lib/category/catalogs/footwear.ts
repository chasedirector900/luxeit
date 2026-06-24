import { type CategoryConfig, makeListingImage } from "@/lib/category/shared";

export const footwearConfig: CategoryConfig = {
  slug: "footwear",
  title: "Footwear",
  subtitle: "Browse trending shoes, sneakers, boots, and sandals",
  searchPlaceholder: "Search footwear...",
  hero: {
    badge: "New Collection",
    title: "New Season Footwear",
    subtitle: "Top picks from trusted suppliers",
  },
  chips: [
    { key: "all", label: "All", icon: "Sparkles" },
    { key: "sneakers", label: "Sneakers", icon: "Footprints" },
    { key: "boots", label: "Boots", icon: "Snowflake" },
    { key: "sandals", label: "Sandals", icon: "Sun" },
    { key: "crocs", label: "Crocs", icon: "Waves" },
    { key: "formal", label: "Formal", icon: "Briefcase" },
    { key: "sports", label: "Sports", icon: "Dumbbell" },
  ],
  features: [
    { icon: "ShieldCheck", title: "Trusted Suppliers", subtitle: "Quality you can trust", tint: "text-emerald-500", ring: "bg-emerald-500/10" },
    { icon: "Truck", title: "Fast Shipping", subtitle: "Worldwide delivery", tint: "text-sky-500", ring: "bg-sky-500/10" },
    { icon: "RotateCcw", title: "Easy Returns", subtitle: "Hassle-free returns", tint: "text-violet-500", ring: "bg-violet-500/10" },
  ],
  products: [
    { id: "fw-aerorun-pro", slug: "aerorun-pro-sneakers", title: "AeroRun Pro Sneakers", subtitle: "Men's Running Shoes", subCategory: "sneakers", price: 59.99, originalPrice: 69.99, badge: { label: "-15%", tone: "sale" }, image: makeListingImage("SNEAKERS", "#1e1b4b", "#4338ca") },
    { id: "fw-urban-casual", slug: "urban-casual-sneakers", title: "Urban Casual Sneakers", subtitle: "Men's Casual Shoes", subCategory: "sneakers", price: 49.99, image: makeListingImage("CASUAL", "#0c4a6e", "#0ea5e9") },
    { id: "fw-explorer-chelsea", slug: "explorer-chelsea-boots", title: "Explorer Chelsea Boots", subtitle: "Men's Boots", subCategory: "boots", price: 89.99, badge: { label: "NEW", tone: "new" }, image: makeListingImage("BOOTS", "#451a03", "#b45309") },
    { id: "fw-rugged-trail", slug: "rugged-trail-hiking-boots", title: "Rugged Trail Hiking Boots", subtitle: "Outdoor Boots", subCategory: "boots", price: 74.99, originalPrice: 94.99, badge: { label: "-21%", tone: "sale" }, image: makeListingImage("HIKING", "#1c1917", "#57534e") },
    { id: "fw-comfort-trail", slug: "comfort-trail-sandals", title: "Comfort Trail Sandals", subtitle: "Men's Sandals", subCategory: "sandals", price: 39.99, originalPrice: 49.99, badge: { label: "-20%", tone: "sale" }, image: makeListingImage("SANDALS", "#422006", "#a16207") },
    { id: "fw-summer-slide", slug: "summer-slide-sandals", title: "Summer Slide Sandals", subtitle: "Beach Slides", subCategory: "sandals", price: 24.99, image: makeListingImage("SLIDES", "#134e4a", "#14b8a6") },
    { id: "fw-classic-crocs", slug: "classic-comfort-crocs", title: "Classic Comfort Crocs", subtitle: "Unisex Clogs", subCategory: "crocs", price: 29.99, image: makeListingImage("CROCS", "#155e75", "#22d3ee") },
    { id: "fw-winter-crocs", slug: "lined-winter-crocs", title: "Lined Winter Crocs", subtitle: "Warm Clogs", subCategory: "crocs", price: 34.99, originalPrice: 44.99, badge: { label: "NEW", tone: "new" }, image: makeListingImage("LINED", "#1e3a8a", "#3b82f6") },
    { id: "fw-oxford-leather", slug: "oxford-leather-dress-shoes", title: "Oxford Leather Dress Shoes", subtitle: "Men's Formal", subCategory: "formal", price: 99.99, image: makeListingImage("OXFORD", "#0a0a0a", "#3f3f46") },
    { id: "fw-classic-loafers", slug: "classic-leather-loafers", title: "Classic Leather Loafers", subtitle: "Slip-on Formal", subCategory: "formal", price: 79.99, originalPrice: 89.99, badge: { label: "-11%", tone: "sale" }, image: makeListingImage("LOAFERS", "#292524", "#78716c") },
    { id: "fw-court-trainers", slug: "pro-court-trainers", title: "Pro Court Trainers", subtitle: "Training Shoes", subCategory: "sports", price: 64.99, image: makeListingImage("TRAINERS", "#4c0519", "#e11d48") },
    { id: "fw-marathon-runners", slug: "marathon-speed-runners", title: "Marathon Speed Runners", subtitle: "Performance Shoes", subCategory: "sports", price: 84.99, originalPrice: 99.99, badge: { label: "-15%", tone: "sale" }, image: makeListingImage("SPEED", "#3b0764", "#a855f7") },
  ],
};
