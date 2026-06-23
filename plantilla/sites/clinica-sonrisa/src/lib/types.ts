export interface ClientConfig {
  business: {
    name: string;
    legalName?: string;
    type: string;
    city: string;
    region?: string;
    country: string;
    zone?: string;
    address: string;
    phone: string;
    whatsapp: string;
    email?: string;
    hours: string;
    priceRange?: string;
  };
  brand: {
    logoText: string;
    logoAlt: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  seo: {
    siteUrl: string;
    title: string;
    description: string;
    keywords: string[];
    schemaType: string;
    locale?: string;
  };
  content: {
    hero: {
      headline: string;
      subheadline: string;
      primaryCta: string;
      secondaryCta: string;
    };
    painPoints: string[];
    services: Array<{
      name: string;
      description: string;
    }>;
    trust: {
      title: string;
      items: string[];
    };
    faq: Array<{
      question: string;
      answer: string;
    }>;
    finalCta: {
      title: string;
      body: string;
      button: string;
    };
    whatsappMessage: string;
  };
}
