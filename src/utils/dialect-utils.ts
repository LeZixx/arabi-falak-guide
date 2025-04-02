
import { Dialect, DialectInfo } from "@/types";

export const DIALECTS: DialectInfo[] = [
  { code: "saudi", name: "Saudi", flag: "🇸🇦", nameArabic: "سعودي" },
  { code: "emirati", name: "Emirati", flag: "🇦🇪", nameArabic: "إماراتي" },
  { code: "kuwaiti", name: "Kuwaiti", flag: "🇰🇼", nameArabic: "كويتي" },
  { code: "bahraini", name: "Bahraini", flag: "🇧🇭", nameArabic: "بحريني" },
  { code: "qatari", name: "Qatari", flag: "🇶🇦", nameArabic: "قطري" },
  { code: "omani", name: "Omani", flag: "🇴🇲", nameArabic: "عماني" },
  { code: "yemeni", name: "Yemeni", flag: "🇾🇪", nameArabic: "يمني" },
  { code: "iraqi", name: "Iraqi", flag: "🇮🇶", nameArabic: "عراقي" },
  { code: "lebanese", name: "Lebanese", flag: "🇱🇧", nameArabic: "لبناني" },
  { code: "syrian", name: "Syrian", flag: "🇸🇾", nameArabic: "سوري" },
  { code: "jordanian", name: "Jordanian", flag: "🇯🇴", nameArabic: "أردني" },
  { code: "palestinian", name: "Palestinian", flag: "🇵🇸", nameArabic: "فلسطيني" },
  { code: "egyptian", name: "Egyptian", flag: "🇪🇬", nameArabic: "مصري" },
  { code: "sudanese", name: "Sudanese", flag: "🇸🇩", nameArabic: "سوداني" },
  { code: "moroccan", name: "Moroccan", flag: "🇲🇦", nameArabic: "مغربي" },
  { code: "algerian", name: "Algerian", flag: "🇩🇿", nameArabic: "جزائري" },
  { code: "tunisian", name: "Tunisian", flag: "🇹🇳", nameArabic: "تونسي" },
  { code: "libyan", name: "Libyan", flag: "🇱🇾", nameArabic: "ليبي" },
  { code: "mauritanian", name: "Mauritanian", flag: "🇲🇷", nameArabic: "موريتاني" },
  { code: "somali", name: "Somali", flag: "🇸🇴", nameArabic: "صومالي" },
  { code: "msa", name: "Modern Standard Arabic", flag: "🌐", nameArabic: "الفصحى" }
];

export const getDialectInfo = (dialectCode: Dialect): DialectInfo | undefined => {
  return DIALECTS.find(d => d.code === dialectCode);
};

// Examples for each dialect to help with testing
export const getDialectExample = (dialect: Dialect): string => {
  switch (dialect) {
    case "egyptian":
      return "النهاردة في طاقة إيجابية في الشغل يا صديقي 💼✨";
    case "tunisian":
      return "الكواكب تعطيك دفعة اليوم في العلاقات 💬";
    case "lebanese":
      return "اليوم الطالع مناسب للتواصل والتخطيط 🌙";
    case "msa":
      return "القمر في بيتك السادس، ما يشير إلى تحسّن في الروتين اليومي.";
    case "saudi":
      return "النجوم اليوم تشير إلى فرص جديدة في مجال العمل ✨🌟";
    case "moroccan":
      return "اليوم غادي يكون مزيان للقاءات وصافي المشاكل القديمة 🌙";
    // Add more examples as needed
    default:
      return "✨ الطاقة الكونية تدعمك اليوم في رحلتك الروحية 🌙";
  }
};

export const getDialectGreeting = (dialect: Dialect): string => {
  switch (dialect) {
    case "egyptian":
      return "أهلاً بيك في عالم النجوم والأبراج! 🌟✨";
    case "saudi":
      return "حياك الله في عالم الفلك والتنجيم! ✨🔮";
    case "lebanese":
      return "مرحبا فيك بعالم النجوم والفلك! 🌙✨";
    case "moroccan":
      return "مرحبا بيك فعالم النجوم! ✨🌟";
    case "tunisian":
      return "مرحبا بيك في عالم النجوم والتنجيم! 🌟";
    case "msa":
      return "مرحباً بك في عالم الفلك والتنجيم! ✨🔮";
    // Add more greetings for other dialects
    default:
      return "أهلاً بك في رحلة الفلك والنجوم! 🌙✨";
  }
};
