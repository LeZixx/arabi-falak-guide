
import { Dialect, HoroscopeType, HoroscopeResponse } from "@/types";
import { getDialectExample } from "./dialect-utils";
import { 
  calculateNatalChart,
  generateBirthChartInterpretation 
} from "./swiss-ephemeris-utils";
import { toast } from "sonner";

// Zodiac sign calculation functions
export const getZodiacSign = (birthDate: string): string => {
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  return "Capricorn";
};

// Get emoji for zodiac sign
export const getZodiacEmoji = (sign: string): string => {
  const emojis: Record<string, string> = {
    "Aries": "♈",
    "Taurus": "♉",
    "Gemini": "♊",
    "Cancer": "♋",
    "Leo": "♌",
    "Virgo": "♍",
    "Libra": "♎",
    "Scorpio": "♏",
    "Sagittarius": "♐",
    "Capricorn": "♑",
    "Aquarius": "♒",
    "Pisces": "♓"
  };
  return emojis[sign] || "✨";
};

// Generate a horoscope based on user data using Swiss Ephemeris data
export const generateHoroscopeFromEphemeris = async (
  userId: string,
  chart: any,
  type: HoroscopeType,
  dialect: Dialect
): Promise<HoroscopeResponse> => {
  console.log(`Generating ${type} horoscope from ephemeris data for user ${userId}`);
  
  try {
    // Extract sign data from API response
    const sunSign = chart.planets.Sun.sign;
    const moonSign = chart.planets.Moon.sign;
    const ascendantSign = chart.hasBirthTime ? chart.ascendant?.sign : null;
    
    console.log(`Using Sun sign: ${sunSign}, Moon sign: ${moonSign}, Ascendant: ${ascendantSign || 'Not available'}`);
    
    // Get dialect example content to adjust language style
    const dialectContent = getDialectExample(dialect);
    
    // Generate horoscope content based on type and chart data
    let content = "";
    const titles = {
      daily: "توقعات اليوم",
      love: "توقعات الحب والعلاقات",
      career: "توقعات العمل والمهنة",
      health: "توقعات الصحة والعافية"
    };
    
    // Generate content based on type and planetary positions
    switch (type) {
      case "daily":
        content = `اليوم والشمس في برج ${sunSign}، ${generateDailyContent(sunSign, moonSign, ascendantSign, dialect)}`;
        break;
      case "love":
        content = `مع وجود الزهرة في وضع ${chart.planets.Venus?.retrograde ? "تراجع" : "تقدم"}، ${generateLoveContent(sunSign, moonSign, chart.planets.Venus?.sign, dialect)}`;
        break;
      case "career":
        content = `مع وجود المشتري في برج ${chart.planets.Jupiter?.sign}، ${generateCareerContent(sunSign, chart.planets.Mars?.sign, chart.planets.Saturn?.sign, dialect)}`;
        break;
      case "health":
        content = `${generateHealthContent(sunSign, moonSign, chart.planets.Mars?.sign, dialect)}`;
        break;
    }
    
    // Generate lucky elements
    const luckyNumber = Math.floor(Math.random() * 33) + 1;
    const luckyStars = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر", "المريخ", "زحل"];
    const luckyColors = ["الأزرق", "الأخضر", "الذهبي", "الفضي", "الأرجواني", "الأحمر", "الأصفر"];
    
    const luckyStar = luckyStars[Math.floor(Math.random() * luckyStars.length)];
    const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
    
    return {
      title: titles[type],
      content,
      luckyNumber,
      luckyStar,
      luckyColor
    };
  } catch (error) {
    console.error("Error generating horoscope from ephemeris:", error);
    // Return generic content if something goes wrong
    return generateGenericHoroscope(type, dialect);
  }
};

// Helper functions for content generation
const generateDailyContent = (sunSign: string, moonSign: string, ascendantSign: string | null, dialect: Dialect): string => {
  const contents = [
    `تشير الكواكب اليوم إلى فترة مميزة من النمو الشخصي. المشتري في وضع إيجابي يفتح أمامك أبواباً جديدة للتطور والتعلم. استفد من هذه الطاقة الإيجابية لتحقيق أهدافك.`,
    `القمر في برج ${moonSign} يتناغم مع شمسك في برج ${sunSign} مما يمنحك طاقة إيجابية لإنجاز مشاريعك. فرصة جيدة للتواصل مع أشخاص مؤثرين في محيطك.`,
    `تدخل اليوم في دورة إيجابية مع وجود عطارد في موقع مناسب. أفكارك واضحة وقدرتك على التعبير في أفضل حالاتها. استغل هذا اليوم للمناقشات المهمة واتخاذ القرارات.`
  ];
  
  return contents[Math.floor(Math.random() * contents.length)];
};

const generateLoveContent = (sunSign: string, moonSign: string, venusSign: string | undefined, dialect: Dialect): string => {
  const contents = [
    `تؤثر الزهرة بشكل إيجابي على حياتك العاطفية هذه الفترة، مما يعزز جاذبيتك الشخصية ويجعلك أكثر انفتاحاً. إذا كنت في علاقة، ستشعر برغبة أكبر في التعبير عن مشاعرك.`,
    `العلاقات العاطفية في وضع حساس مع وجود القمر في برج ${moonSign}. خذ وقتك للتفكير قبل اتخاذ أي قرار مصيري. الصراحة والوضوح سيكونان مفتاح الحل للكثير من المشاكل.`,
    `فرص جديدة في الأفق مع وجود الزهرة في برج ${venusSign || sunSign}. إذا كنت عازباً، قد تلتقي بشخص مميز. للمرتبطين، هذه فترة مثالية لتجديد الرومانسية في العلاقة.`
  ];
  
  return contents[Math.floor(Math.random() * contents.length)];
};

const generateCareerContent = (sunSign: string, marsSign: string | undefined, saturnSign: string | undefined, dialect: Dialect): string => {
  const contents = [
    `المريخ في وضع قوي في خريطتك الفلكية يمنحك دفعة من الطاقة والحماس في مجال العمل. هناك فرصة لإثبات مهاراتك القيادية وتحقيق إنجازات ملموسة.`,
    `زحل في برج ${saturnSign || sunSign} يدعوك للتركيز على التخطيط طويل المدى. قد تواجه بعض التحديات، لكنها ستكون فرصة لإثبات قدراتك وتطوير مهاراتك المهنية.`,
    `المشتري يفتح أبواباً جديدة في مجال عملك. كن مستعداً للفرص غير المتوقعة واستغل شبكة علاقاتك المهنية. الوقت مناسب للتقدم بطلب ترقية أو زيادة في الراتب.`
  ];
  
  return contents[Math.floor(Math.random() * contents.length)];
};

const generateHealthContent = (sunSign: string, moonSign: string, marsSign: string | undefined, dialect: Dialect): string => {
  const contents = [
    `عطارد والشمس في تناغم يعززان صحتك النفسية والجسدية. هذه فترة مثالية للاهتمام بالتوازن بين العقل والجسد. مارس تقنيات الاسترخاء والتأمل للحفاظ على هدوئك النفسي.`,
    `القمر في برج ${moonSign} يؤثر على نمط حياتك. انتبه لنظامك الغذائي وحاول الالتزام بروتين رياضي منتظم. الابتعاد عن التوتر والضغوط النفسية سيكون له أثر إيجابي كبير على صحتك.`,
    `المريخ يمنحك طاقة إضافية هذه الفترة. استغلها في ممارسة الرياضة وتحسين لياقتك البدنية. الانتظام في النوم والتغذية السليمة سيساعدانك على الاستفادة القصوى من هذه الطاقة الإيجابية.`
  ];
  
  return contents[Math.floor(Math.random() * contents.length)];
};

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
    
    // Log the complete chart data for verification
    console.log("Complete chart data from API:", JSON.stringify(chart));
    
    // Extract Sun and Moon sign directly from API response - no translation needed
    // The API returns planet positions in the format we need
    const sunData = chart.planets.Sun || {};
    const moonData = chart.planets.Moon || {};
    
    console.log(`VERIFICATION - Horoscope calculation using chart with JD: ${chart.julianDay}`);
    console.log(`VERIFICATION - Sun sign used in horoscope: ${sunData.sign}`);
    console.log(`VERIFICATION - Moon sign used in horoscope: ${moonData.sign}`);
    console.log(`VERIFICATION - Ascendant used in horoscope: ${chart.ascendant?.sign || 'Not available'}`);
    
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
    
    // Log the complete chart data for verification
    console.log("Complete chart data for birth chart analysis:", JSON.stringify(chart));
    
    // Generate interpretation using the comprehensive method
    // This will use the exact data from the API without any transformation
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
