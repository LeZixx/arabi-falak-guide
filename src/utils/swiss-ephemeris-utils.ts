
/**
 * Integration with Google Cloud API for astrological calculations
 */

import { HoroscopeResponse, HoroscopeType, Dialect } from "@/types";
import { getDialectExample } from "./dialect-utils";
import { toast } from "sonner";

// API endpoint for natal chart calculations
const ASTRO_API_URL = "https://astrohabibiapi-564958434402.me-central1.run.app/natal-chart";

// Zodiac signs in Arabic
const zodiacSigns = [
  "الحمل", "الثور", "الجوزاء", "السرطان", 
  "الأسد", "العذراء", "الميزان", "العقرب", 
  "القوس", "الجدي", "الدلو", "الحوت"
];

// Function to calculate natal chart using Google Cloud API
export const calculateNatalChart = async (
  userId: string,
  birthDate: string, 
  birthTime: string, 
  birthPlace: string
): Promise<any> => {
  console.log(`Fetching chart data from API for: ${birthDate} ${birthTime} ${birthPlace}`);
  
  try {
    // Convert birthDate to the format expected by the API (if needed)
    const formattedBirthDate = formatDateForAPI(birthDate);
    
    // Convert birthPlace to latitude and longitude (or use as is if your API accepts city names)
    const location = await getLocationCoordinates(birthPlace);
    
    // Prepare request payload with all required parameters
    const payload = {
      userId,
      birthDate: formattedBirthDate,
      birthTime,
      birthPlace,
      // Add additional parameters that might be required by your API
      latitude: location?.latitude,
      longitude: location?.longitude
    };
    
    console.log("Sending payload to API:", JSON.stringify(payload));
    
    // Make API request
    const response = await fetch(ASTRO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    // Get the response as text first to log it for debugging
    const responseText = await response.text();
    console.log("API response:", responseText);
    
    // Parse the response if it's valid JSON
    let chartData;
    try {
      chartData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse API response as JSON:", e);
      throw new Error("Invalid API response format");
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}. Message: ${chartData.error || 'Unknown error'}`);
    }
    
    // Return the chart data
    return chartData;
    
  } catch (error) {
    console.error("Error fetching natal chart:", error);
    toast.error("Failed to fetch astrological data. Using placeholder data instead.");
    
    // Return placeholder data in case of error
    return generatePlaceholderChartData();
  }
};

// Helper function to format date for the API
const formatDateForAPI = (dateString: string): string => {
  // By default, return the date as is - modify if your API needs a different format
  return dateString;
};

// Helper function to get coordinates from place name
// You can implement this with a geocoding service if needed
const getLocationCoordinates = async (placeName: string): Promise<{latitude: number, longitude: number} | null> => {
  // This is a placeholder - in a real implementation you would use a geocoding service
  // For now, return null which tells our code to just use the place name as provided
  return null;
};

// Generate placeholder chart data for fallback
const generatePlaceholderChartData = () => {
  return {
    planets: [
      { planet: "الشمس", sign: "الحمل", degree: 15.5, retrograde: false },
      { planet: "القمر", sign: "السرطان", degree: 24.3, retrograde: false },
      { planet: "عطارد", sign: "الحوت", degree: 3.7, retrograde: true },
      { planet: "الزهرة", sign: "الثور", degree: 7.2, retrograde: false },
      { planet: "المريخ", sign: "العقرب", degree: 18.9, retrograde: false }
    ],
    houses: [
      { house: 1, sign: "الدلو" },
      { house: 2, sign: "الحوت" },
      { house: 3, sign: "الحمل" },
      { house: 4, sign: "الثور" },
      { house: 5, sign: "الجوزاء" },
      { house: 6, sign: "السرطان" },
      { house: 7, sign: "الأسد" },
      { house: 8, sign: "العذراء" },
      { house: 9, sign: "الميزان" },
      { house: 10, sign: "العقرب" },
      { house: 11, sign: "القوس" },
      { house: 12, sign: "الجدي" }
    ],
    ascendant: "الدلو",
    aspects: [
      { planet1: "الشمس", planet2: "المريخ", aspect: "تربيع", orb: 2.1 },
      { planet1: "القمر", planet2: "الزهرة", aspect: "تثليث", orb: 1.5 },
      { planet1: "عطارد", planet2: "زحل", aspect: "مقابلة", orb: 0.8 }
    ]
  };
};

// Get zodiac sign from birth date
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
  return "الحوت"; // Feb 19 - Mar 20
};

// Get emoji for zodiac sign
export const getZodiacEmoji = (zodiacSign: string): string => {
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
  
  return emojis[zodiacSign] || "✨";
};

// Function to generate horoscope from API chart data
export const generateHoroscopeFromEphemeris = async (
  userId: string,
  chart: any,
  type: HoroscopeType,
  dialect: Dialect
): Promise<HoroscopeResponse> => {
  console.log(`Generating ${type} horoscope with ${dialect} dialect based on chart data`);
  
  try {
    // We'll use the chart data to generate a more personalized horoscope
    // If the API doesn't provide horoscope content directly, we can use the chart data to customize our responses
    
    // For now, create a structured response based on chart data and horoscope type
    const horoscopeContent = generateContentFromChart(chart, type, dialect);
    
    return {
      title: getTitleForType(type),
      content: horoscopeContent,
      luckyNumber: getLuckyNumberFromChart(chart),
      luckyStar: getLuckyStarFromChart(chart),
      luckyColor: getLuckyColorFromChart(chart)
    };
    
  } catch (error) {
    console.error("Error generating horoscope:", error);
    return generatePlaceholderHoroscope(type, dialect);
  }
};

// Helper function to generate personalized content from chart data
const generateContentFromChart = (chart: any, type: HoroscopeType, dialect: Dialect): string => {
  // If we have real chart data, use it to create personalized content
  if (chart && chart.planets && chart.houses) {
    // Get key planets for different horoscope types
    const sun = chart.planets.find((p: any) => p.planet === "الشمس");
    const moon = chart.planets.find((p: any) => p.planet === "القمر");
    const mercury = chart.planets.find((p: any) => p.planet === "عطارد");
    const venus = chart.planets.find((p: any) => p.planet === "الزهرة");
    const mars = chart.planets.find((p: any) => p.planet === "المريخ");
    
    // Generate different content based on horoscope type
    switch (type) {
      case "daily":
        return `يتواجد القمر اليوم في برج ${moon?.sign || "السرطان"} مما يؤثر على مزاجك ويجعلك أكثر ${moon?.sign === "العقرب" ? "حدسًا" : "انفتاحًا"}. الشمس في ${sun?.sign || "الحمل"} تعزز ثقتك بنفسك وتمنحك طاقة إيجابية للتعامل مع التحديات اليومية. استفد من هذه الطاقة في تحقيق أهدافك.`;
        
      case "love":
        return `تؤثر الزهرة المتواجدة في برج ${venus?.sign || "الثور"} على حياتك العاطفية بشكل ${venus?.retrograde ? "معقد" : "إيجابي"}. هذا الوقت مناسب ${venus?.retrograde ? "لإعادة التفكير في علاقاتك" : "للتواصل مع من تحب"}. العلاقات التي تبدأ في هذه الفترة ستكون ${venus?.sign === "الجوزاء" ? "مثيرة ومليئة بالتواصل الفكري" : "عميقة وعاطفية"}.`;
        
      case "career":
        return `المريخ في برج ${mars?.sign || "العقرب"} يمنحك دفعة قوية في مجال العمل. هذه فترة مثالية ${mars?.retrograde ? "لإعادة تقييم مسارك المهني" : "للتقدم والمبادرة بمشاريع جديدة"}. الفرص المهنية المتاحة الآن تتطلب منك ${mars?.sign === "الأسد" ? "القيادة والثقة بالنفس" : "العمل الجماعي والتعاون"}.`;
        
      case "health":
        return `عطارد المتواجد في ${mercury?.sign || "الحوت"} يؤثر على حالتك الذهنية ويجعلك ${mercury?.retrograde ? "أكثر تشتتاً" : "أكثر تركيزاً"}. انتبه لصحتك النفسية واحرص على ممارسة التأمل والاسترخاء. من الناحية الجسدية، يجب الاهتمام بـ${mercury?.sign === "العذراء" ? "نظامك الغذائي" : "راحتك وجودة نومك"}.`;
    }
  }
  
  // If no chart data or unmatched type, return example for that dialect
  return getDialectExample(dialect);
};

// Helper functions for generating lucky elements
const getLuckyNumberFromChart = (chart: any): number => {
  if (chart && chart.houses && chart.planets) {
    // Generate a number based on positions in the chart
    const moonDegree = chart.planets.find((p: any) => p.planet === "القمر")?.degree || 0;
    const baseNumber = Math.floor(moonDegree) % 10 + 1;
    return baseNumber > 0 ? baseNumber : 7; // Ensure positive number, default to 7
  }
  return getRandomLuckyNumber();
};

const getLuckyStarFromChart = (chart: any): string => {
  if (chart && chart.planets) {
    // Find the planet with the most favorable position
    const planets = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر"];
    // Return a planet name based on some chart calculation
    const planetIndex = chart.planets.length % planets.length;
    return planets[planetIndex];
  }
  return getRandomLuckyStar();
};

const getLuckyColorFromChart = (chart: any): string => {
  if (chart && chart.ascendant) {
    // Map ascendant signs to colors
    const colorMap: Record<string, string> = {
      "الحمل": "الأحمر",
      "الثور": "الأخضر",
      "الجوزاء": "الأصفر",
      "السرطان": "الفضي",
      "الأسد": "الذهبي",
      "العذراء": "الأزرق الفاتح",
      "الميزان": "الوردي",
      "العقرب": "الأحمر الداكن",
      "القوس": "الأرجواني",
      "الجدي": "البني",
      "الدلو": "الأزرق",
      "الحوت": "الأزرق البحري"
    };
    return colorMap[chart.ascendant] || "الأزرق";
  }
  return getRandomLuckyColor();
};

// Helper functions for titles and fallback data
const getTitleForType = (type: HoroscopeType): string => {
  const titles = {
    daily: "توقعات اليوم",
    love: "توقعات الحب والعلاقات",
    career: "توقعات العمل والمهنة",
    health: "توقعات الصحة والعافية"
  };
  return titles[type];
};

const getRandomLuckyNumber = (): number => {
  const luckyNumbers = [3, 7, 9, 12, 21, 33];
  return luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)];
};

const getRandomLuckyStar = (): string => {
  const luckyStars = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر"];
  return luckyStars[Math.floor(Math.random() * luckyStars.length)];
};

const getRandomLuckyColor = (): string => {
  const luckyColors = ["الأزرق", "الأخضر", "الذهبي", "الفضي", "الأرجواني"];
  return luckyColors[Math.floor(Math.random() * luckyColors.length)];
};

const generatePlaceholderHoroscope = (type: HoroscopeType, dialect: Dialect): HoroscopeResponse => {
  const titles = {
    daily: "توقعات اليوم",
    love: "توقعات الحب والعلاقات",
    career: "توقعات العمل والمهنة",
    health: "توقعات الصحة والعافية"
  };
  
  // Use dialect-specific content example as placeholder
  const content = getDialectExample(dialect);
  
  return {
    title: titles[type],
    content,
    luckyNumber: getRandomLuckyNumber(),
    luckyStar: getRandomLuckyStar(),
    luckyColor: getRandomLuckyColor()
  };
};
