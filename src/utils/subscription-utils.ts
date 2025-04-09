
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
    questionsPerMonth: null // unlimited during trial
  },
  {
    id: 1,
    name: "Starter",
    arabicName: "المبتدئ",
    icon: "🌟",
    description: "100 questions/month, 1 topic, 7-day forecast",
    arabicDescription: "100 سؤال شهريًا، موضوع واحد، توقعات لمدة 7 أيام",
    price: 4.99,
    questionsPerMonth: 100
  },
  {
    id: 2,
    name: "Core",
    arabicName: "الأساسي",
    icon: "🔮",
    description: "150 questions/month, any topic, 7-day forecast",
    arabicDescription: "150 سؤال شهريًا، أي موضوع، توقعات لمدة 7 أيام",
    price: 9.99,
    questionsPerMonth: 150
  },
  {
    id: 3,
    name: "Pro",
    arabicName: "المحترف",
    icon: "✨",
    description: "200 questions/month, any topic, 2-year forecast",
    arabicDescription: "200 سؤال شهريًا، أي موضوع، توقعات لمدة عامين",
    price: 14.99,
    questionsPerMonth: 200
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
  // During trial, everything is accessible
  if (isInTrialPeriod(firstLoginDate)) {
    return true;
  }
  
  // Free tier with daily limit
  if (tier === 0) {
    if (feature === "questions" && hasReachedDailyLimit(questionsToday)) {
      return false;
    }
    return true;
  }
  
  // Paid tiers
  switch (feature) {
    case "daily":
      return true; // All paid tiers have access
    case "topic":
      return tier >= 1; // All paid tiers have at least one topic
    case "all_topics":
      return tier >= 2; // Core and Pro have all topics
    case "questions":
      return true; // All paid tiers have questions (with monthly limits)
    default:
      return false;
  }
};

export const canAccessHoroscopeType = (
  tier: SubscriptionTier,
  type: HoroscopeType,
  firstLoginDate: string | null
): boolean => {
  // During trial, everything is accessible
  if (isInTrialPeriod(firstLoginDate)) {
    return true;
  }
  
  // Free tier can access daily only
  if (tier === 0) {
    return type === "daily";
  }
  
  if (type === "daily") {
    return true;
  } else if (type === "love" || type === "career" || type === "health") {
    if (tier === 1) {
      // Starter tier can only access one topic (love)
      return type === "love";
    }
    // Core and Pro can access all topics
    return tier >= 2;
  }
  return false;
};

export const getForecastRange = (tier: SubscriptionTier): string => {
  if (tier === 3) {
    return "عامين"; // 2 years for Pro
  }
  return "7 أيام"; // 7 days for others
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
