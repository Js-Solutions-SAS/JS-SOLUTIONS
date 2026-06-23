import type { ClientConfig } from "./types";

export function cleanPhone(value: string): string {
  return String(value || "").replace(/[^\d]/g, "");
}

export function createWhatsappHref(client: ClientConfig): string {
  const phone = cleanPhone(client.business.whatsapp || client.business.phone);
  const text = encodeURIComponent(client.content.whatsappMessage);
  return `https://wa.me/${phone}?text=${text}`;
}

export function createMapsSearchHref(client: ClientConfig): string {
  const query = encodeURIComponent(`${client.business.name} ${client.business.address} ${client.business.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function createLocalBusinessJsonLd(client: ClientConfig) {
  return {
    "@context": "https://schema.org",
    "@type": client.seo.schemaType || "LocalBusiness",
    "@id": `${client.seo.siteUrl.replace(/\/$/, "")}/#business`,
    name: client.business.name,
    legalName: client.business.legalName || client.business.name,
    url: client.seo.siteUrl,
    image: `${client.seo.siteUrl.replace(/\/$/, "")}/og-image.svg`,
    telephone: client.business.phone,
    email: client.business.email,
    priceRange: client.business.priceRange || "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: client.business.address,
      addressLocality: client.business.city,
      addressRegion: client.business.region,
      addressCountry: client.business.country,
    },
    areaServed: [
      {
        "@type": "City",
        name: client.business.city,
      },
    ],
    openingHours: client.business.hours,
    makesOffer: client.content.services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description,
      },
    })),
  };
}

export function createFaqJsonLd(client: ClientConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: client.content.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
