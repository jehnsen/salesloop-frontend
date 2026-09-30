export interface SocialLink {
  platform: "facebook" | "instagram" | "tiktok" | "messenger";
  label: string;
  url: string;
}

export interface PaymentMethod {
  id: string;
  label: string;
  enabled: boolean;
}

export interface SiteConfig {
  storeName: string;
  tagline: string;
  platformName: string;
  seller: {
    name: string;
    role: string;
    distributorId: string;
    bio: string;
  };
  contact: {
    mobile: string;
    email: string;
    messenger: string;
    address: string;
    hours: string;
  };
  socials: SocialLink[];
  deliveryAreas: string[];
  paymentMethods: PaymentMethod[];
  disclaimers: {
    independentSeller: string;
    health: string;
    ai: string;
    pricing: string;
  };
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: "product_catalog" | "faq" | "document" | "policy";
  items: number;
  approved: boolean;
  updatedAt: string;
}
