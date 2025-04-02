
import { SubscriptionTier, HoroscopeType } from "@/types";

export const SUBSCRIPTION_TIERS = [
  {
    id: 0,
    name: "Free",
    arabicName: "مجاني",
    icon: "🆓",
    description: "Weekly horoscope only",
    arabicDescription: "قراءة أسبوعية فقط",
    price: 0
  },
  {
    id: 1,
    name: "Star Gazer",
    arabicName: "راصد النجوم",
    icon: "💫",
    description: "Daily horoscope",
    arabicDescription: "قراءة يومية",
    price: 2.99
  },
  {
    id: 2,
    name: "Moon Child",
    arabicName: "ابن القمر",
    icon: "🔮",
    description: "Daily horoscope + 1 topic",
    arabicDescription: "قراءة يومية + موضوع واحد",
    price: 4.99
  },
  {
    id: 3,
    name: "Celestial",
    arabicName: "سماوي",
    icon: "🌌",
    description: "Daily horoscope + all topics",
    arabicDescription: "قراءة يومية + جميع المواضيع",
    price: 7.99
  },
  {
    id: 4,
    name: "Cosmic Guide",
    arabicName: "المرشد الكوني",
    icon: "🪐",
    description: "Everything + unlimited questions",
    arabicDescription: "كل شيء + أسئلة غير محدودة",
    price: 12.99
  }
];

export const canAccessFeature = (
  tier: SubscriptionTier,
  feature: "daily" | "topic" | "all_topics" | "questions"
): boolean => {
  switch (feature) {
    case "daily":
      return tier >= 1;
    case "topic":
      return tier >= 2;
    case "all_topics":
      return tier >= 3;
    case "questions":
      return tier >= 4;
    default:
      return false;
  }
};

export const canAccessHoroscopeType = (
  tier: SubscriptionTier,
  type: HoroscopeType
): boolean => {
  if (type === "daily") {
    return tier >= 1;
  } else if (type === "love" || type === "career" || type === "health") {
    // Can access one topic at tier 2
    // Can access all topics at tier 3+
    return tier >= 3 || (tier === 2 && type === "love"); // Assuming love is the default for tier 2
  }
  return false;
};

export const getUpgradeMessage = (
  currentTier: SubscriptionTier,
  requiredFeature: "daily" | "topic" | "all_topics" | "questions"
): string => {
  const requiredTier = requiredFeature === "daily" ? 1 :
                      requiredFeature === "topic" ? 2 :
                      requiredFeature === "all_topics" ? 3 : 4;
  
  const tierInfo = SUBSCRIPTION_TIERS[requiredTier];
  
  return `✨ للوصول إلى هذه الميزة، تحتاج إلى الترقية إلى خطة ${tierInfo.arabicName} ${tierInfo.icon}\n` +
         `السعر: $${tierInfo.price}/شهر\n` +
         `المميزات: ${tierInfo.arabicDescription}`;
};
