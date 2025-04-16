
/**
 * Integration with Google Cloud API for astrological calculations
 */

import { HoroscopeResponse, HoroscopeType, Dialect } from "@/types";
import { getDialectExample } from "./dialect-utils";

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
    // Prepare request payload
    const payload = {
      userId,
      birthDate,
      birthTime,
      birthPlace
    };
    
    // Make API request
    const response = await fetch(ASTRO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Parse and return the chart data
    const chartData = await response.json();
    return chartData;
    
  } catch (error) {
    console.error("Error fetching natal chart:", error);
    
    // Return placeholder data in case of error
    return {
      planets: [
        { planet: "الشمس", sign: "الحمل", degree: 15.5, retrograde: false },
        { planet: "القمر", sign: "السرطان", degree: 24.3, retrograde: false },
        { planet: "عطارد", sign: "الحوت", degree: 3.7, retrograde: true }
      ],
      houses: [
        { house: 1, sign: "الدلو" },
        { house: 2, sign: "الحوت" },
        { house: 3, sign: "الحمل" }
      ],
      ascendant: "الدلو",
      aspects: [
        { planet1: "الشمس", planet2: "المريخ", aspect: "تربيع", orb: 2.1 },
        { planet1: "القمر", planet2: "الزهرة", aspect: "تثليث", orb: 1.5 }
      ]
    };
  }
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
    // We assume the chart data from API already contains horoscope information
    // If not, you may need to make another API call here
    
    // Extract horoscope data from chart if available
    if (chart && chart.horoscopes && chart.horoscopes[type]) {
      const horoscopeData = chart.horoscopes[type];
      
      return {
        title: horoscopeData.title || getTitleForType(type),
        content: horoscopeData.content || getDialectExample(dialect),
        luckyNumber: horoscopeData.luckyNumber || getRandomLuckyNumber(),
        luckyStar: horoscopeData.luckyStar || getRandomLuckyStar(),
        luckyColor: horoscopeData.luckyColor || getRandomLuckyColor()
      };
    }
    
    // Fallback to placeholders if no horoscope data in chart
    return generatePlaceholderHoroscope(type, dialect);
    
  } catch (error) {
    console.error("Error generating horoscope:", error);
    return generatePlaceholderHoroscope(type, dialect);
  }
};

// Helper functions for fallback/placeholder data
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
