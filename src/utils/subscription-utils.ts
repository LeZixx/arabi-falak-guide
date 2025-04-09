
import { SubscriptionTier, HoroscopeType } from "@/types";

export const SUBSCRIPTION_TIERS = [
  {
    id: 0,
    name: "Free Trial",
    arabicName: "تجربة مجانية",
    icon: "🆓",
    description: "7-day trial, then 3 questions per day",
    arabicDescription: "تجربة مجانية لمدة 7 أيام، ثم 3 أسئلة يوميًا",
    price: 0,
    questionsPerMonth: null, // unlimited during trial
    characterLimit: 500 // Character limit for free users
  },
  {
    id: 1,
    name: "Starter",
    arabicName: "المبتدئ",
    icon: "🌟",
    description: "100 questions/month, 1 topic, 7-day forecast",
    arabicDescription: "100 سؤال شهريًا، موضوع واحد، توقعات لمدة 7 أيام",
    price: 7,
    questionsPerMonth: 100,
    characterLimit: null // No character limit for paid users
  },
  {
    id: 2,
    name: "Core",
    arabicName: "الأساسي",
    icon: "🔮",
    description: "150 questions/month, any topic, 7-day forecast",
    arabicDescription: "150 سؤال شهريًا، أي موضوع، توقعات لمدة 7 أيام",
    price: 14,
    questionsPerMonth: 150,
    characterLimit: null
  },
  {
    id: 3,
    name: "Pro",
    arabicName: "المحترف",
    icon: "✨",
    description: "200 questions/month, any topic, 2-year forecast",
    arabicDescription: "200 سؤال شهريًا، أي موضوع، توقعات لمدة عامين",
    price: 25,
    questionsPerMonth: 200,
    characterLimit: null
  }
];

// Helper to check if user is still in trial period (7 days from first login)
export const isInTrialPeriod = (firstLoginDate: string | null): boolean => {
  if (!firstLoginDate) return true; // No first login date recorded, assume in trial
  
  const firstLogin = new Date(firstLoginDate);
  const now = new Date();
  const diffTime = now.getTime() - firstLogin.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays <= 7;
};

// Check if user has reached daily question limit for free tier
export const hasReachedDailyLimit = (questionsToday: number): boolean => {
  return questionsToday >= 3;
};

export const canAccessFeature = (
  tier: SubscriptionTier,
  feature: "daily" | "topic" | "all_topics" | "questions",
  firstLoginDate: string | null,
  questionsToday: number
): boolean => {
  if (isInTrialPeriod(firstLoginDate)) {
    return true;
  }
  
  if (tier === 0) {
    if (feature === "questions" && hasReachedDailyLimit(questionsToday)) {
      return false;
    }
    return true;
  }
  
  switch (feature) {
    case "daily":
      return true;
    case "topic":
      return tier >= 1;
    case "all_topics":
      return tier >= 2;
    case "questions":
      return true;
    default:
      return false;
  }
};

export const canAccessHoroscopeType = (
  tier: SubscriptionTier,
  type: HoroscopeType,
  firstLoginDate: string | null
): boolean => {
  if (isInTrialPeriod(firstLoginDate)) {
    return true;
  }
  
  if (tier === 0) {
    return type === "daily";
  }
  
  if (type === "daily") {
    return true;
  } else if (type === "love" || type === "career" || type === "health") {
    if (tier === 1) {
      return type === "love";
    }
    return tier >= 2;
  }
  return false;
};

export const getForecastRange = (tier: SubscriptionTier): string => {
  if (tier === 3) {
    return "عامين";
  }
  return "7 أيام";
};

export const getUpgradeMessage = (
  currentTier: SubscriptionTier,
  requiredFeature: "daily" | "topic" | "all_topics" | "questions",
  isTrialEnded: boolean = false,
  reachedDailyLimit: boolean = false
): string => {
  if (currentTier === 0 && isTrialEnded && reachedDailyLimit) {
    return "❗ لقد وصلت إلى الحد اليومي (3 أسئلة). يرجى الترقية إلى إحدى باقاتنا للحصول على المزيد من الأسئلة.";
  }
  
  if (currentTier === 0 && isTrialEnded) {
    return "❗ لقد انتهت فترة التجربة المجانية. يرجى الترقية للاستمرار بالوصول الكامل.";
  }
  
  const requiredTier = requiredFeature === "daily" ? 1 :
                      requiredFeature === "topic" ? 1 :
                      requiredFeature === "all_topics" ? 2 : 1;
  
  const tierInfo = SUBSCRIPTION_TIERS[requiredTier];
  
  return `✨ للوصول إلى هذه الميزة، تحتاج إلى الترقية إلى خطة ${tierInfo.arabicName} ${tierInfo.icon}\n` +
         `السعر: $${tierInfo.price}/شهر\n` +
         `المميزات: ${tierInfo.arabicDescription}`;
};

export const getCharacterLimit = (tier: SubscriptionTier, isInTrial: boolean): number | null => {
  if (isInTrial) {
    return null;
  }
  
  const tierInfo = SUBSCRIPTION_TIERS.find(t => t.id === tier);
  return tierInfo?.characterLimit || null;
};
