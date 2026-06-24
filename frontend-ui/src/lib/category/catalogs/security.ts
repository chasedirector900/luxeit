import { type CategoryConfig, makeListingImage } from "@/lib/category/shared";

export const securityConfig: CategoryConfig = {
  slug: "security",
  title: "Security",
  subtitle: "CCTV, alarms, smart locks, sensors, and safety gear",
  searchPlaceholder: "Search security...",
  hero: {
    badge: "Stay Protected",
    title: "Home & Business Security",
    subtitle: "Trusted security gear from verified suppliers",
  },
  chips: [
    { key: "all", label: "All", icon: "Sparkles" },
    { key: "cameras", label: "CCTV", icon: "Cctv" },
    { key: "alarms", label: "Alarms", icon: "Siren" },
    { key: "locks", label: "Smart Locks", icon: "Lock" },
    { key: "sensors", label: "Sensors", icon: "Radar" },
    { key: "access", label: "Access", icon: "Fingerprint" },
    { key: "lighting", label: "Lighting", icon: "Lightbulb" },
  ],
  features: [
    { icon: "ShieldCheck", title: "Verified Sellers", subtitle: "Quality you can trust", tint: "text-emerald-500", ring: "bg-emerald-500/10" },
    { icon: "Truck", title: "Fast Shipping", subtitle: "Worldwide delivery", tint: "text-sky-500", ring: "bg-sky-500/10" },
    { icon: "RotateCcw", title: "Easy Returns", subtitle: "Hassle-free returns", tint: "text-violet-500", ring: "bg-violet-500/10" },
  ],
  products: [
    { id: "se-wifi-cam-1080", slug: "wifi-security-camera-1080p", title: "WiFi Security Camera 1080p", subtitle: "Indoor · Night vision", subCategory: "cameras", price: 29.99, originalPrice: 39.99, badge: { label: "-25%", tone: "sale" }, image: makeListingImage("CAMERA", "#0f172a", "#0ea5e9") },
    { id: "se-cctv-kit-4", slug: "4-camera-cctv-kit", title: "4-Camera CCTV Kit", subtitle: "DVR · 1TB included", subCategory: "cameras", price: 199.99, badge: { label: "NEW", tone: "new" }, image: makeListingImage("CCTV KIT", "#020617", "#1d4ed8") },
    { id: "se-ptz-outdoor", slug: "outdoor-ptz-camera", title: "Outdoor PTZ Camera", subtitle: "Pan-tilt · Weatherproof", subCategory: "cameras", price: 74.99, originalPrice: 94.99, badge: { label: "-21%", tone: "sale" }, image: makeListingImage("PTZ", "#0c4a6e", "#38bdf8") },
    { id: "se-doorbell-cam", slug: "video-doorbell-camera", title: "Video Doorbell Camera", subtitle: "2-way audio · Motion alerts", subCategory: "cameras", price: 59.99, image: makeListingImage("DOORBELL", "#1e1b4b", "#4338ca") },
    { id: "se-alarm-system", slug: "wireless-home-alarm-system", title: "Wireless Home Alarm System", subtitle: "App control · Expandable", subCategory: "alarms", price: 89.99, originalPrice: 109.99, badge: { label: "-18%", tone: "sale" }, image: makeListingImage("ALARM", "#4c0519", "#e11d48") },
    { id: "se-siren-strobe", slug: "loud-siren-strobe", title: "Loud Siren & Strobe", subtitle: "120dB · Indoor/outdoor", subCategory: "alarms", price: 24.99, image: makeListingImage("SIREN", "#450a0a", "#f97316") },
    { id: "se-fingerprint-lock", slug: "smart-fingerprint-door-lock", title: "Smart Fingerprint Door Lock", subtitle: "Fingerprint · Code · App", subCategory: "locks", price: 129.99, originalPrice: 159.99, badge: { label: "-19%", tone: "sale" }, image: makeListingImage("SMART LOCK", "#1c1917", "#a16207") },
    { id: "se-keypad-deadbolt", slug: "keypad-deadbolt-lock", title: "Keypad Deadbolt Lock", subtitle: "PIN entry · Auto-lock", subCategory: "locks", price: 79.99, image: makeListingImage("DEADBOLT", "#0a0a0a", "#52525b") },
    { id: "se-motion-sensor", slug: "wireless-motion-sensor", title: "Wireless Motion Sensor (PIR)", subtitle: "Pet-friendly · Battery", subCategory: "sensors", price: 14.99, image: makeListingImage("MOTION", "#134e4a", "#10b981") },
    { id: "se-door-sensor", slug: "door-window-contact-sensor", title: "Door & Window Sensor", subtitle: "Contact alerts · 2-pack", subCategory: "sensors", price: 19.99, originalPrice: 27.99, badge: { label: "-29%", tone: "sale" }, image: makeListingImage("SENSOR", "#155e75", "#22d3ee") },
    { id: "se-smoke-detector", slug: "smart-smoke-detector", title: "Smart Smoke Detector", subtitle: "Phone alerts · 10yr battery", subCategory: "sensors", price: 34.99, image: makeListingImage("SMOKE", "#7c2d12", "#f59e0b") },
    { id: "se-fingerprint-reader", slug: "fingerprint-access-reader", title: "Fingerprint Access Reader", subtitle: "Door entry · 100 users", subCategory: "access", price: 64.99, badge: { label: "NEW", tone: "new" }, image: makeListingImage("ACCESS", "#1e1b4b", "#7c3aed") },
    { id: "se-rfid-keypad", slug: "rfid-keypad-access", title: "RFID Keypad Access", subtitle: "Card + PIN · Standalone", subCategory: "access", price: 44.99, originalPrice: 54.99, badge: { label: "-18%", tone: "sale" }, image: makeListingImage("RFID", "#312e81", "#6366f1") },
    { id: "se-floodlight", slug: "motion-sensor-floodlight", title: "Motion Sensor Floodlight", subtitle: "LED · Auto on-detect", subCategory: "lighting", price: 39.99, originalPrice: 49.99, badge: { label: "-20%", tone: "sale" }, image: makeListingImage("FLOOD", "#1e293b", "#f59e0b") },
    { id: "se-solar-light", slug: "solar-security-light", title: "Solar Security Light", subtitle: "Wireless · Motion-activated", subCategory: "lighting", price: 27.99, image: makeListingImage("SOLAR", "#14532d", "#84cc16") },
  ],
};
