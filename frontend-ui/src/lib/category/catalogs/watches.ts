import { type CategoryConfig, makeListingImage } from "@/lib/category/shared";

// A whole new category page — just a config object. No new components or routes.
export const watchesConfig: CategoryConfig = {
  slug: "watches",
  title: "Watches",
  subtitle: "Browse analog, digital, smart, and luxury timepieces",
  searchPlaceholder: "Search watches...",
  hero: {
    badge: "New Collection",
    title: "Timeless & Smart",
    subtitle: "Curated watches from trusted suppliers",
  },
  chips: [
    { key: "all", label: "All", icon: "Sparkles" },
    { key: "analog", label: "Analog", icon: "Clock" },
    { key: "digital", label: "Digital", icon: "Timer" },
    { key: "smart", label: "Smart", icon: "Watch" },
    { key: "luxury", label: "Luxury", icon: "Crown" },
    { key: "sport", label: "Sport", icon: "Activity" },
  ],
  features: [
    { icon: "ShieldCheck", title: "Trusted Suppliers", subtitle: "Quality you can trust", tint: "text-emerald-500", ring: "bg-emerald-500/10" },
    { icon: "Truck", title: "Fast Shipping", subtitle: "Worldwide delivery", tint: "text-sky-500", ring: "bg-sky-500/10" },
    { icon: "RotateCcw", title: "Easy Returns", subtitle: "Hassle-free returns", tint: "text-violet-500", ring: "bg-violet-500/10" },
  ],
  products: [
    { id: "wt-classic-analog", slug: "classic-analog-watch", title: "Classic Analog Watch", subtitle: "Leather Strap", subCategory: "analog", price: 44.99, originalPrice: 59.99, badge: { label: "-25%", tone: "sale" }, image: makeListingImage("ANALOG", "#1c1917", "#a16207") },
    { id: "wt-minimal-analog", slug: "minimalist-dress-watch", title: "Minimalist Dress Watch", subtitle: "Slim Steel Case", subCategory: "analog", price: 54.99, image: makeListingImage("DRESS", "#0a0a0a", "#52525b") },
    { id: "wt-digital-sport", slug: "digital-sport-watch", title: "Digital Sport Watch", subtitle: "Water Resistant", subCategory: "digital", price: 29.99, image: makeListingImage("DIGITAL", "#052e16", "#16a34a") },
    { id: "wt-retro-digital", slug: "retro-digital-watch", title: "Retro Digital Watch", subtitle: "Backlit Display", subCategory: "digital", price: 24.99, badge: { label: "NEW", tone: "new" }, image: makeListingImage("RETRO", "#172554", "#2563eb") },
    { id: "wt-smart-pro", slug: "smartfit-pro-watch", title: "SmartFit Pro Watch", subtitle: "Heart Rate & GPS", subCategory: "smart", price: 89.99, originalPrice: 109.99, badge: { label: "-18%", tone: "sale" }, image: makeListingImage("SMART", "#1e1b4b", "#6366f1") },
    { id: "wt-smart-lite", slug: "smartfit-lite-band", title: "SmartFit Lite Band", subtitle: "Fitness Tracker", subCategory: "smart", price: 39.99, image: makeListingImage("BAND", "#083344", "#06b6d4") },
    { id: "wt-luxury-chrono", slug: "luxury-chronograph-watch", title: "Luxury Chronograph", subtitle: "Sapphire Glass", subCategory: "luxury", price: 149.99, badge: { label: "NEW", tone: "new" }, image: makeListingImage("LUXURY", "#1c1917", "#b45309") },
    { id: "wt-gold-automatic", slug: "gold-automatic-watch", title: "Gold Automatic Watch", subtitle: "Self-Winding", subCategory: "luxury", price: 129.99, originalPrice: 159.99, badge: { label: "-19%", tone: "sale" }, image: makeListingImage("GOLD", "#451a03", "#d97706") },
    { id: "wt-rugged-field", slug: "rugged-field-watch", title: "Rugged Field Watch", subtitle: "Shock Resistant", subCategory: "sport", price: 49.99, image: makeListingImage("FIELD", "#1c1917", "#65a30d") },
    { id: "wt-dive-sport", slug: "dive-sport-watch", title: "Dive Sport Watch", subtitle: "100m Water Resist", subCategory: "sport", price: 64.99, originalPrice: 79.99, badge: { label: "-19%", tone: "sale" }, image: makeListingImage("DIVE", "#0c4a6e", "#0284c7") },
  ],
};
