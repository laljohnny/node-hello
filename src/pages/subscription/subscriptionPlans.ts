import { Briefcase, Crown, Medal, Sparkles } from "lucide-react";

export type PlanId = "starter" | "premium" | "ultimate" | "professional";

export type PlanFeatures = {
  users: string;
  locations: string;
  assets: string;
  storage: string;
};

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  icon: typeof Sparkles;
  price?: number;
  billedPrice?: number;
  period?: string;
  badge?: string;
  badgeBg?: string;
  color: string;
  contactSales?: boolean;
  features: PlanFeatures;
  selected?: boolean;
  subText?: string;
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Sparkles,
    price: 99,
    billedPrice: 1188,
    period: "month",
    subText: "Standard features",
    color: "#fff",
    badgeBg: "#fff",
    features: {
      users: "1",
      locations: "1",
      assets: "100",
      storage: "100GB",
    },
    selected: false,
  },
  {
    id: "premium",
    name: "Premium",
    icon: Medal,
    price: 399,
    billedPrice: 4788,
    period: "month",
    subText: "Advanced features",
    badge: "Most Popular",
    color: "#fff",
    badgeBg: "#3b82f6",
    features: {
      users: "5",
      locations: "5",
      assets: "500",
      storage: "500GB",
    },
    selected: true,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    icon: Crown,
    price: 699,
    billedPrice: 8388,
    period: "month",
    subText: "Professional features",
    color: "#fff",
    badgeBg: "transparent",
    features: {
      users: "10+",
      locations: "10+",
      assets: "2000+",
      storage: "2TB+",
    },
    selected: false,
  },
  {
    id: "professional",
    name: "Professional/MSP",
    icon: Briefcase,
    contactSales: true,
    color: "#fff",
    subText: "All Inclusive features",
    badgeBg: "#1F2937",
    badge: "For Contractors",
    features: {
      users: "Unlimited",
      locations: "Unlimited",
      assets: "Unlimited",
      storage: "5TB+",
    },
    selected: false,
  },
];

export const planFeatureMeta: Array<{ key: keyof PlanFeatures; label: string }> = [
  { key: "users", label: "Users" },
  { key: "locations", label: "Locations" },
  { key: "assets", label: "Assets" },
  { key: "storage", label: "Assets Storage" },
];

export type FeatureRow = {
  label: string;
  tooltip?: string;
  values: Record<PlanId, boolean | string>;
};

export const featureRows: FeatureRow[] = [
  {
    label: "Multi-company",
    tooltip: "Add and manage additional companies.Perfect for contractors, subcontractors and licensed trade professionals who want to make jobs drastically easier by having instant access to customers`asset data and plans.",
    values: {
      starter: false,
      premium: false,
      ultimate: false,
      professional: true,
    },
  },
  {
    label: "Electrical panel mapping",
    tooltip: "Map your electrical panels so that you always know what each circuit is connected to.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Plumbing mapping",
    tooltip: "Map your plumbing assets so that you always know what everything is connected to.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "HVAC",
    tooltip: "Manage your air conditioning, heating and other HVAC assets .",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Mechanical",
    tooltip: "Manage all your mechanical assets.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Fire-Life Safety",
    tooltip: "Manage your fire extinguishers, smoke detectors and other fire-life safety assets.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Affected area views",
    tooltip: "See what is affected when circuits, plumbing or other assets or break down, go offline or need to be shut down.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Service reminders",
    tooltip: "Get notified by email and on your phone when assets are due for upcoming service.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "In-app messaging",
    tooltip: "Instantly communicate with your facilities team, HR, IT and any others involved in your facilities asset management and service process.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Reporting dashboard",
    tooltip: "Instantly view important asset information such as upcoming and past due service requirements.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Mobile app",
    tooltip: "Access your facilities data from your phone.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Offline mode",
    tooltip: "Your data is always available, even when your Wi-Fi is not.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Visual asset mapping",
    tooltip: "View all your assets on visual floor pans and building maps.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "QR code labeling & scanning",
    tooltip: "Print and scan QR codes to easily identify assets from your phone.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Data importing & exporting",
    tooltip: "Easily import and export your asset data from and to Excel,Google docs or any other spreadsheet.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Definable roles & permissions",
    tooltip: "Customize access for each member of your team and outside technicians.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Photo capture & annotation",
    tooltip: "Upload pictures and add notes to share with your team.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Invite contactors & technicians",
    tooltip: "Invite outside contractors and technicians to securely access your facilities data on a limited one-time or ongoing basis.",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Email & phone support",
    tooltip: "We love to help our customers!",
    values: {
      starter: true,
      premium: true,
      ultimate: true,
      professional: true,
    },
  },
  {
    label: "Work orders (coming soon)",
    tooltip: "Assign and track work orders.",
    values: {
      starter: "--",
      premium: "--",
      ultimate: "--",
      professional: "--",
    },
  },
  {
    label: "Instant parts ordering (coming soon)",
    tooltip: "When you need to order replacement parts, CriticalAsset makes it easy!.",
    values: {
      starter: "--",
      premium: "--",
      ultimate: "--",
      professional: "--",
    },
  },
  {
    label: "Technician directory (coming soon)",
    tooltip: "Instantly find qualified local technicians and schedule service calls.",
    values: {
      starter: "--",
      premium: "--",
      ultimate: "--",
      professional: "--",
    },
  },
  {
    label: "IoT sensors (coming soon)",
    tooltip: "Fix problems before they happen and track assets with CriticalAsset IoT sensors.",
    values: {
      starter: "--",
      premium: "--",
      ultimate: "--",
      professional: "--",
    },
  },
  {
    label: "Integrations (coming soon)",
    tooltip: "Use CMMS software and don't want to switch? No worries! CriticalAsset integrates with many CMMS and other software.",
    values: {
      starter: "--",
      premium: "--",
      ultimate: "--",
      professional: "--",
    },
  },
];
