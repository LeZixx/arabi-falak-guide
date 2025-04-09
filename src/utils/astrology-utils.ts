
import { Dialect, HoroscopeType, HoroscopeResponse } from "@/types";
import { getDialectExample } from "./dialect-utils";
import { calculateNatalChart, generateHoroscopeFromEphemeris } from "./swiss-ephemeris-utils";

// This would be replaced with actual astrology calculations and API calls
export const generateHoroscope = (
  birthDate: string,
  birthTime: string,
  birthPlace: string,
  type: HoroscopeType,
  dialect: Dialect
): HoroscopeResponse => {
  // Calculate natal chart using Swiss Ephemeris (placeholder)
  const chart = calculateNatalChart(birthDate, birthTime, birthPlace);
  
  // In a real implementation, we would use this chart data
  // For demo purposes, we're still using static examples
  
  const exampleResponse = getDialectExample(dialect);
  
  // More detailed and comprehensive responses now that we've removed the character limit for paid users
  const detailedResponses = {
    daily: "تشير الكواكب اليوم إلى فترة مميزة من النمو الشخصي. المشتري في وضع إيجابي يفتح أمامك أبواباً جديدة للتطور والتعلم. استفد من هذه الطاقة الإيجابية لتحقيق أهدافك. قد تلتقي بشخص له تأثير إيجابي على مستقبلك المهني. القمر في برجك يجعلك أكثر حساسية وإدراكاً للتفاصيل الصغيرة في محيطك. استمع لحدسك ولا تتردد في اتخاذ قرارات جريئة. الوقت مناسب للمبادرة والتحرك نحو أهدافك بثقة وإيجابية.",
    love: "تؤثر الزهرة بشكل إيجابي على حياتك العاطفية هذه الفترة، مما يعزز جاذبيتك الشخصية ويجعلك أكثر انفتاحاً على التجارب الجديدة. إذا كنت في علاقة، ستشعر برغبة أكبر في التعبير عن مشاعرك وتعميق الروابط مع شريك حياتك. الوقت مناسب للمحادثات الصادقة التي تبني الثقة وتعزز التفاهم. إذا كنت أعزب، فإن هذه فترة مثالية للتعرف على أشخاص جدد، حيث تكون الطاقة الكونية داعمة للقاءات ذات معنى. استمع لقلبك واتبع حدسك في اختياراتك العاطفية.",
    career: "المريخ في وضع قوي في خريطتك الفلكية يمنحك دفعة من الطاقة والحماس في مجال العمل. هناك فرصة لإثبات مهاراتك القيادية وتحقيق إنجازات ملموسة. الوقت مناسب للمبادرة بمشاريع جديدة أو طلب ترقية. زحل يدعم جهودك على المدى البعيد، مما يعني أن العمل الجاد الذي تقوم به الآن سيؤتي ثماره في المستقبل. لا تتردد في التعبير عن أفكارك المبتكرة، فالظروف الفلكية تدعم الإبداع والابتكار في بيئة العمل. توقع تطورات إيجابية في مسارك المهني إذا حافظت على التركيز والالتزام.",
    health: "عطارد والشمس في تناغم يعززان صحتك النفسية والجسدية. هذه فترة مثالية للاهتمام بالتوازن بين العقل والجسد. مارس تقنيات الاسترخاء والتأمل للحفاظ على هدوئك النفسي. النظام الغذائي المتوازن سيكون له تأثير إيجابي ملحوظ على طاقتك وحيويتك. انتبه بشكل خاص للراحة الكافية، فالقمر في وضع يؤثر على أنماط نومك. تجنب الإجهاد المفرط واستمع لإشارات جسدك. الممارسة المنتظمة للرياضة ستساعد في تصريف الطاقة الزائدة وتعزيز المناعة. هذه فترة جيدة للبدء في عادات صحية جديدة ستستمر معك على المدى الطويل."
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
  
  // Use more detailed content for responses
  return {
    title: titles[type],
    content: detailedResponses[type] || exampleResponse,
    luckyNumber: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
    luckyStar: luckyStars[Math.floor(Math.random() * luckyStars.length)],
    luckyColor: luckyColors[Math.floor(Math.random() * luckyColors.length)]
  };
};

export const getZodiacSign = (birthDate: string): string => {
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "الحمل";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "الثور";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "الجوزاء";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "السرطان";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "الأسد";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "العذراء";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "الميزان";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "العقرب";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "القوس";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "الجدي";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "الدلو";
  return "الحوت"; // Pisces (Feb 19 - Mar 20)
};

export const getZodiacEmoji = (sign: string): string => {
  const emojis: Record<string, string> = {
    "الحمل": "♈",
    "الثور": "♉",
    "الجوزاء": "♊",
    "السرطان": "♋",
    "الأسد": "♌",
    "العذراء": "♍",
    "الميزان": "♎",
    "العقرب": "♏",
    "القوس": "♐",
    "الجدي": "♑",
    "الدلو": "♒",
    "الحوت": "♓"
  };
  
  return emojis[sign] || "✨";
};
