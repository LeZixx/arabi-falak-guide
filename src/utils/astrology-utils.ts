
import { Dialect, HoroscopeType, HoroscopeResponse } from "@/types";
import { getDialectExample } from "./dialect-utils";
import { 
  calculateNatalChart, 
  generateHoroscopeFromEphemeris, 
  getZodiacSign, 
  getZodiacEmoji,
  generateBirthChartInterpretation 
} from "./swiss-ephemeris-utils";
import { toast } from "sonner";

// Generate a horoscope based on user data using AstroHabibi API
export const generateHoroscope = async (
  userId: string,
  birthDate: string,
  birthTime: string,
  birthPlace: string,
  type: HoroscopeType,
  dialect: Dialect
): Promise<HoroscopeResponse> => {
  try {
    console.log(`Attempting to generate ${type} horoscope for user ${userId}`);
    
    // Calculate natal chart using the updated API
    const chart = await calculateNatalChart(userId, birthDate, birthTime, birthPlace);
    
    // Verify the key positions in the chart match our expectations for the given birth details
    const sun = chart.planets.find((p: any) => p.planet === "الشمس");
    const moon = chart.planets.find((p: any) => p.planet === "القمر");
    
    console.log(`VERIFICATION - Horoscope calculation using chart with JD: ${chart.julianDay}`);
    console.log(`VERIFICATION - Sun sign used in horoscope: ${sun?.sign}`);
    console.log(`VERIFICATION - Moon sign used in horoscope: ${moon?.sign}`);
    console.log(`VERIFICATION - Ascendant used in horoscope: ${chart.ascendant}`);
    
    // Generate personalized horoscope from chart data
    return await generateHoroscopeFromEphemeris(userId, chart, type, dialect);
  } catch (error) {
    console.error("Error in horoscope generation process:", error);
    toast.error("Could not generate personalized horoscope. Using generic forecast.");
    
    // Log detailed error for debugging
    console.error("Failed to generate horoscope:", { 
      userId, 
      birthDate, 
      birthTime, 
      birthPlace, 
      type, 
      dialect, 
      error 
    });
    
    // Return a generic response based on dialect when API fails
    return generateGenericHoroscope(type, dialect);
  }
};

// Generate a complete birth chart interpretation
export const generateBirthChartAnalysis = async (
  userId: string,
  birthDate: string,
  birthTime: string,
  birthPlace: string
): Promise<string> => {
  try {
    // Check if birth time is provided
    const hasBirthTime = !!birthTime && birthTime.trim() !== "";
    
    // Calculate natal chart
    const chart = await calculateNatalChart(userId, birthDate, birthTime || "12:00", birthPlace);
    
    // Generate interpretation using the comprehensive method
    return generateBirthChartInterpretation(chart, hasBirthTime);
    
  } catch (error) {
    console.error("Error in birth chart analysis generation:", error);
    toast.error("Could not generate detailed birth chart analysis. Using generic information.");
    
    // Return a generic birth chart analysis
    return generateGenericBirthChartAnalysis(birthDate);
  }
};

// Generate a generic birth chart analysis when API fails
const generateGenericBirthChartAnalysis = (birthDate: string): string => {
  const zodiacSign = getZodiacSign(birthDate);
  const zodiacEmoji = getZodiacEmoji(zodiacSign);
  
  return `✨ تحليل خريطتك الفلكية ✨\n\n` +
    `🪐 نظرة عامة:\n` +
    `برجك هو ${zodiacSign} ${zodiacEmoji}\n` +
    `الشمس في برج ${zodiacSign} تعكس جوهر شخصيتك وقوتك الحيوية.\n\n` +
    `لم نتمكن من الحصول على تفاصيل خريطتك الفلكية الكاملة في هذه اللحظة. يرجى المحاولة مرة أخرى لاحقًا للحصول على تحليل شامل ودقيق.\n\n` +
    `يمكنك استخدام الأوامر التالية للحصول على توقعات مختلفة:\n` +
    `🔮 /horoscope - قراءة يومية\n` +
    `❤️ /love - توقعات الحب\n` +
    `💼 /career - توقعات العمل\n` +
    `🌿 /health - توقعات الصحة`;
};

// Generate a generic horoscope when API fails
const generateGenericHoroscope = (type: HoroscopeType, dialect: Dialect): HoroscopeResponse => {
  console.warn("Generating generic horoscope as API request failed");
  
  // Get example response for the dialect
  const baseContent = getDialectExample(dialect);
  
  // Type-specific content (these would ideally come from the API)
  const detailedResponses = {
    daily: "تشير الكواكب اليوم إلى فترة مميزة من النمو الشخصي. المشتري في وضع إيجابي يفتح أمامك أبواباً جديدة للتطور والتعلم. استفد من هذه الطاقة الإيجابية لتحقيق أهدافك. قد تلتقي بشخص له تأثير إيجابي على مستقبلك المهني.",
    love: "تؤثر الزهرة بشكل إيجابي على حياتك العاطفية هذه الفترة، مما يعزز جاذبيتك الشخصية ويجعلك أكثر انفتاحاً على التجارب الجديدة. إذا كنت في علاقة، ستشعر برغبة أكبر في التعبير عن مشاعرك وتعميق الروابط مع شريك حياتك.",
    career: "المريخ في وضع قوي في خريطتك الفلكية يمنحك دفعة من الطاقة والحماس في مجال العمل. هناك فرصة لإثبات مهاراتك القيادية وتحقيق إنجازات ملموسة. الوقت مناسب للمبادرة بمشاريع جديدة أو طلب ترقية.",
    health: "عطارد والشمس في تناغم يعززان صحتك النفسية والجسدية. هذه فترة مثالية للاهتمام بالتوازن بين العقل والجسد. مارس تقنيات الاسترخاء والتأمل للحفاظ على هدوئك النفسي."
  };
  
  // Titles for different horoscope types
  const titles = {
    daily: "توقعات اليوم",
    love: "توقعات الحب والعلاقات",
    career: "توقعات العمل والمهنة",
    health: "توقعات الصحة والعافية"
  };
  
  // Generate random lucky elements
  const luckyNumbers = [3, 7, 9, 12, 21, 33];
  const luckyStars = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر"];
  const luckyColors = ["الأزرق", "الأخضر", "الذهبي", "الفضي", "الأرجواني"];
  
  return {
    title: titles[type],
    content: detailedResponses[type] || baseContent,
    luckyNumber: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
    luckyStar: luckyStars[Math.floor(Math.random() * luckyStars.length)],
    luckyColor: luckyColors[Math.floor(Math.random() * luckyColors.length)]
  };
};

// Re-export functions for convenience
export { getZodiacSign, getZodiacEmoji };
