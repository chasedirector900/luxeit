// Single source of truth for SEO/brand constants, shared by the metadata files
// (robots, sitemap, manifest), the root layout, and per-page metadata.

export const SITE_URL = "https://www.luxeit.co.zm";
export const SITE_NAME = "Luxeit";
export const SITE_TAGLINE = "Premium imports, delivered";
export const SITE_DESCRIPTION =
  "Premium products from China, delivered across Zambia. Shop electronics, fashion, home & more on Luxeit — shipping included.";

// Structured data (schema.org JSON-LD) that helps search engines show a rich,
// detailed result for the brand: the org name, logo, and site identity.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    image: `${SITE_URL}/opengraph-image`,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    areaServed: { "@type": "Country", name: "Zambia" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Luxeit Zambia",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
