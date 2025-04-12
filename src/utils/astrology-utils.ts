
import { Dialect, HoroscopeType, HoroscopeResponse } from "@/types";
import { getDialectExample } from "./dialect-utils";
import { 
  calculateNatalChart, 
  generateHoroscopeFromEphemeris, 
  getZodiacSign, 
  getZodiacEmoji
} from "./swiss-ephemeris-utils";

// Generate a horoscope based on user data
export const generateHoroscope = async (
  userId: string,
  birthDate: string,
  birthTime: string,
  birthPlace: string,
  type: HoroscopeType,
  dialect: Dialect
): Promise<HoroscopeResponse> => {
  try {
    // Calculate natal chart using Swiss Ephemeris via Supabase
    const chart = await calculateNatalChart(userId, birthDate, birthTime, birthPlace);
    
    // Generate personalized horoscope from chart data
    return await generateHoroscopeFromEphemeris(userId, chart, type, dialect);
  } catch (error) {
    console.error("Error generating horoscope:", error);
    
    // Fallback to example responses if there's an error
    const exampleResponse = getDialectExample(dialect);
    
    const detailedResponses = {
      daily: "تشير الكواكب اليوم إلى فترة مميزة من النمو الشخصي. المشتري في وضع إيجابي يفتح أمامك أبواباً جديدة للتطور والتعلم. استفد من هذه الطاقة الإيجابية لتحقيق أهدافك. قد تلتقي بشخص له تأثير إيجابي على مستقبلك المهني.",
      love: "تؤثر الزهرة بشكل إيجابي على حياتك العاطفية هذه الفترة، مما يعزز جاذبيتك الشخصية ويجعلك أكثر انفتاحاً على التجارب الجديدة. إذا كنت في علاقة، ستشعر برغبة أكبر في التعبير عن مشاعرك وتعميق الروابط مع شريك حياتك.",
      career: "المريخ في وضع قوي في خريطتك الفلكية يمنحك دفعة من الطاقة والحماس في مجال العمل. هناك فرصة لإثبات مهاراتك القيادية وتحقيق إنجازات ملموسة. الوقت مناسب للمبادرة بمشاريع جديدة أو طلب ترقية.",
      health: "عطارد والشمس في تناغم يعززان صحتك النفسية والجسدية. هذه فترة مثالية للاهتمام بالتوازن بين العقل والجسد. مارس تقنيات الاسترخاء والتأمل للحفاظ على هدوئك النفسي."
    };
    
    const titles = {
      daily: "توقعات اليوم",
      love: "توقعات الحب والعلاقات",
      career: "توقعات العمل والمهنة",
      health: "توقعات الصحة والعافية"
    };
    
    // Randomize some elements to make it feel dynamic
    const luckyNumbers = [3, 7, 9, 12, 21, 33];
    const luckyStars = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر"];
    const luckyColors = ["الأزرق", "الأخضر", "الذهبي", "الفضي", "الأرجواني"];
    
    return {
      title: titles[type],
      content: detailedResponses[type] || exampleResponse,
      luckyNumber: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
      luckyStar: luckyStars[Math.floor(Math.random() * luckyStars.length)],
      luckyColor: luckyColors[Math.floor(Math.random() * luckyColors.length)]
    };
  }
};

// Re-export functions from swiss-ephemeris-utils for convenience
export { getZodiacSign, getZodiacEmoji };
