
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
    // Get coordinates from the birth place
    const coordinates = await getLocationCoordinates(birthPlace);
    
    if (!coordinates) {
      console.error("Could not get coordinates for location:", birthPlace);
      throw new Error(`Could not get coordinates for location: ${birthPlace}`);
    }
    
    // Format date for API (YYYY-MM-DD)
    const formattedDate = formatDateForAPI(birthDate);
    
    // Make sure time is in 24h format (HH:mm)
    const formattedTime = formatTimeForAPI(birthTime);
    
    // Prepare payload exactly as expected by the API
    const payload = {
      date: formattedDate,
      time: formattedTime,
      lat: coordinates.latitude,
      lon: coordinates.longitude
    };
    
    console.log("Sending payload to API:", JSON.stringify(payload));
    
    // Make API request with proper headers and JSON body
    const response = await fetch(ASTRO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Check if response was OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API returned status ${response.status}:`, errorText);
      throw new Error(`API error: ${response.status}. Message: ${errorText || 'Unknown error'}`);
    }
    
    // Get response text for debugging
    const responseText = await response.text();
    console.log("API response:", responseText);
    
    // Attempt to parse the response as JSON
    let apiData;
    try {
      apiData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse API response as JSON:", e);
      throw new Error(`Invalid API response format: ${responseText}`);
    }
    
    // Check if response contains an error
    if (apiData.error) {
      console.error("API returned an error:", apiData.error);
      throw new Error(`API error: ${apiData.error}`);
    }
    
    // Validate that the API response contains the data we need
    if (!apiData.timestamp || !apiData.julianDay || !apiData.coordinates) {
      console.error("API response missing required data:", apiData);
      throw new Error("API response missing critical fields (timestamp, julianDay, coordinates)");
    }
    
    // Calculate astrological chart based on julianDay and coordinates
    const chart = calculateChartFromJulianDay(
      apiData.julianDay, 
      apiData.coordinates.latitude, 
      apiData.coordinates.longitude
    );
    
    console.log("Successfully calculated chart from API data:", chart);
    
    // Return the chart data
    return chart;
    
  } catch (error) {
    console.error("Error fetching natal chart:", error);
    toast.error("Failed to fetch astrological data. Please try again later.");
    throw error; // Propagate error to calling function
  }
};

// Calculate chart based on Julian Day and coordinates
const calculateChartFromJulianDay = (julianDay: number, latitude: number, longitude: number): any => {
  console.log(`Calculating chart for Julian Day: ${julianDay}, Lat: ${latitude}, Lon: ${longitude}`);
  
  // Here we would normally use a proper astronomical calculation library
  // For now, we'll generate a realistic chart based on the Julian Day
  
  // Use Julian Day to seed a deterministic calculation
  const seed = Math.floor(julianDay * 1000) % 10000;
  const random = (offset: number = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return Math.abs(x - Math.floor(x));
  };
  
  // Generate planet positions based on the Julian Day
  const planets = [
    { planet: "الشمس", sign: zodiacSigns[Math.floor(random(1) * 12)], degree: random(2) * 29, retrograde: random(3) > 0.8 },
    { planet: "القمر", sign: zodiacSigns[Math.floor(random(4) * 12)], degree: random(5) * 29, retrograde: false },
    { planet: "عطارد", sign: zodiacSigns[Math.floor(random(6) * 12)], degree: random(7) * 29, retrograde: random(8) > 0.7 },
    { planet: "الزهرة", sign: zodiacSigns[Math.floor(random(9) * 12)], degree: random(10) * 29, retrograde: random(11) > 0.9 },
    { planet: "المريخ", sign: zodiacSigns[Math.floor(random(12) * 12)], degree: random(13) * 29, retrograde: random(14) > 0.8 },
    { planet: "المشتري", sign: zodiacSigns[Math.floor(random(15) * 12)], degree: random(16) * 29, retrograde: random(17) > 0.7 },
    { planet: "زحل", sign: zodiacSigns[Math.floor(random(18) * 12)], degree: random(19) * 29, retrograde: random(20) > 0.6 },
    { planet: "أورانوس", sign: zodiacSigns[Math.floor(random(21) * 12)], degree: random(22) * 29, retrograde: random(23) > 0.5 },
    { planet: "نبتون", sign: zodiacSigns[Math.floor(random(24) * 12)], degree: random(25) * 29, retrograde: random(26) > 0.6 },
    { planet: "بلوتو", sign: zodiacSigns[Math.floor(random(27) * 12)], degree: random(28) * 29, retrograde: random(29) > 0.7 }
  ];
  
  // Generate house positions
  const houses = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (Math.floor(random(i + 30) * 12) + i) % 12;
    return {
      house: i + 1,
      sign: zodiacSigns[signIndex]
    };
  });
  
  // Calculate ascendant
  const ascSignIndex = Math.floor(random(42) * 12);
  const ascendant = zodiacSigns[ascSignIndex];
  
  // Generate aspects between planets
  const aspects = generateAspects(planets);
  
  return {
    timestamp: new Date(julianDay).toISOString(),
    julianDay,
    planets,
    houses,
    ascendant,
    aspects
  };
};

// Generate aspects between planets
const generateAspects = (planets: any[]) => {
  const aspects = [];
  const aspectTypes = ["تربيع", "تثليث", "مقابلة", "سداسي", "خماسي"];
  
  // Generate key aspects between planets
  for (let i = 0; i < planets.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 3, planets.length); j++) {
      if (Math.random() > 0.6) { // Only generate some aspects, not all combinations
        const aspectTypeIndex = Math.floor(Math.random() * aspectTypes.length);
        aspects.push({
          planet1: planets[i].planet,
          planet2: planets[j].planet,
          aspect: aspectTypes[aspectTypeIndex],
          orb: +(Math.random() * 5).toFixed(1)
        });
      }
    }
  }
  
  return aspects;
};

// Format date for API (YYYY-MM-DD format)
const formatDateForAPI = (dateString: string): string => {
  try {
    // Parse the input date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    throw error;
  }
};

// Format time for API (HH:mm format)
const formatTimeForAPI = (timeString: string): string => {
  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(timeString)) {
    console.warn(`Time format may be invalid: ${timeString}`);
    // Attempt to fix common formats or return as is
  }
  return timeString;
};

// Get coordinates from place name using a mock geocoding service
const getLocationCoordinates = async (placeName: string): Promise<{latitude: number, longitude: number} | null> => {
  // Simple mock geocoding database for common cities
  const geocodeDB: Record<string, {latitude: number, longitude: number}> = {
    "القاهرة": { latitude: 30.0444, longitude: 31.2357 },
    "بيروت": { latitude: 33.8886, longitude: 35.4955 },
    "دبي": { latitude: 25.2048, longitude: 55.2708 },
    "الرياض": { latitude: 24.7136, longitude: 46.6753 },
    "عمان": { latitude: 31.9454, longitude: 35.9284 },
    "بغداد": { latitude: 33.3152, longitude: 44.3661 },
    "دمشق": { latitude: 33.5138, longitude: 36.2765 },
    "الجزائر": { latitude: 36.7372, longitude: 3.0864 },
    "طرابلس": { latitude: 32.8872, longitude: 13.1913 },
    "الخرطوم": { latitude: 15.5007, longitude: 32.5599 }
  };
  
  // Check if we have coordinates for the place
  for (const city in geocodeDB) {
    if (placeName.includes(city)) {
      return geocodeDB[city];
    }
  }
  
  // Default coordinates for unknown places (Cairo, Egypt as default)
  console.log("Using default coordinates for unknown location:", placeName);
  return { latitude: 30.0444, longitude: 31.2357 };
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
    // Create personalized horoscope content based on chart data
    const horoscopeContent = generateContentFromChart(chart, type, dialect);
    
    return {
      title: getTitleForType(type),
      content: horoscopeContent,
      luckyNumber: getLuckyNumberFromChart(chart),
      luckyStar: getLuckyStarFromChart(chart),
      luckyColor: getLuckyColorFromChart(chart)
    };
  } catch (error) {
    console.error("Error generating horoscope from chart data:", error);
    throw error; // Let the parent function handle the error
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
        return `المريخ في برج ${mars?.sign || "العقرب"} يمنحك دفعة قوية في مجال العمل. هذه فترة مثالية ${mars?.retrograde ? "لإعادة تقييم مسارك المهني" : "لالتقدم والمبادرة بمشاريع جديدة"}. الفرص المهنية المتاحة الآن تتطلب منك ${mars?.sign === "الأسد" ? "القيادة والثقة بالنفس" : "العمل الجماعي والتعاون"}.`;
        
      case "health":
        return `عطارد المتواجد في ${mercury?.sign || "الحوت"} يؤثر على حالتك الذهنية ويجعلك ${mercury?.retrograde ? "أكثر تشتتاً" : "أكثر تركيزاً"}. انتبه لصحتك النفسية واحرص على ممارسة التأمل والاسترخاء. من الناحية الجسدية، يجب الاهتمام بـ${mercury?.sign === "العذراء" ? "نظامك الغذائي" : "راحتك وجودة نومك"}.`;
    }
  }
  
  // If no chart data or unmatched type, return example for that dialect
  return getDialectExample(dialect);
};

// Helper functions for generating lucky elements
const getLuckyNumberFromChart = (chart: any): number => {
  if (chart && chart.planets) {
    // Generate a number based on positions in the chart
    const planets = chart.planets;
    const sunPosition = planets.find((p: any) => p.planet === "الشمس")?.degree || 0;
    const moonPosition = planets.find((p: any) => p.planet === "القمر")?.degree || 0;
    
    // Create a "lucky" number from planet positions
    const baseNumber = Math.floor((sunPosition + moonPosition) % 40) + 1;
    return baseNumber > 0 ? baseNumber : 7; // Ensure positive number, default to 7
  }
  return getRandomLuckyNumber();
};

const getLuckyStarFromChart = (chart: any): string => {
  if (chart && chart.planets) {
    // Find the planet with the most favorable position
    const planets = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر"];
    
    // Use the Julian Day to deterministically select a "lucky" planet
    const dayValue = chart.julianDay ? Math.floor(chart.julianDay) % 5 : Math.floor(Math.random() * 5);
    return planets[dayValue];
  }
  return getRandomLuckyStar();
};

const getLuckyColorFromChart = (chart: any): string => {
  if (chart && chart.planets) {
    // Map zodiac signs of Sun and Moon to colors
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
    
    const sunSign = chart.planets.find((p: any) => p.planet === "الشمس")?.sign;
    return sunSign ? colorMap[sunSign] : "الأزرق";
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
