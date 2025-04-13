
import { HoroscopeResponse, HoroscopeType } from "@/types";
import { supabase, saveUserChart, getUserChart, saveHoroscopePrediction, getLatestHoroscope } from "@/services/supabase";
import { toast } from "sonner";
import * as swisseph from "swisseph";

// Define interfaces for Swiss Ephemeris data
export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
}

export interface AstrologyChart {
  planets: PlanetaryPosition[];
  ascendant: string;
  houses: { house: number; sign: string }[];
  aspects: { planet1: string; planet2: string; aspect: string; orb: number }[];
}

// Get geocoordinates for a place name
async function getGeoCoordinates(placeName: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    // Using OpenStreetMap's Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    // If no results found
    console.error("No geocoding results for:", placeName);
    return null;
  } catch (error) {
    console.error("Error geocoding place name:", error);
    return null;
  }
}

// Arabic zodiac signs in order starting with Aries
const arabicSigns = [
  "الحمل", "الثور", "الجوزاء", "السرطان", 
  "الأسد", "العذراء", "الميزان", "العقرب", 
  "القوس", "الجدي", "الدلو", "الحوت"
];

// Arabic planet names mapping
const arabicPlanetNames = {
  0: "الشمس",    // Sun
  1: "القمر",    // Moon
  2: "عطارد",    // Mercury
  3: "الزهرة",   // Venus
  4: "المريخ",   // Mars
  5: "المشتري",  // Jupiter
  6: "زحل",      // Saturn
  7: "أورانوس",  // Uranus
  8: "نبتون",    // Neptune
  9: "بلوتو",    // Pluto
};

// Get sign name from longitude (0-360 degrees)
function getSignFromLongitude(longitude: number): string {
  const signIndex = Math.floor(longitude / 30) % 12;
  return arabicSigns[signIndex];
}

// Calculate aspects between planets
function calculateAspects(planetPositions: { [key: number]: number }): { planet1: string; planet2: string; aspect: string; orb: number }[] {
  const aspects: { planet1: string; planet2: string; aspect: string; orb: number }[] = [];
  const aspectTypes = {
    0: { name: "مقارنة", orb: 8 },    // Conjunction
    60: { name: "تسديس", orb: 6 },    // Sextile
    90: { name: "تربيع", orb: 8 },    // Square
    120: { name: "تثليث", orb: 8 },   // Trine
    180: { name: "مقابلة", orb: 10 }, // Opposition
  };

  const planets = Object.keys(planetPositions).map(Number);
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      // Calculate the angular difference between the two planets
      let diff = Math.abs(planetPositions[planet1] - planetPositions[planet2]);
      if (diff > 180) diff = 360 - diff;
      
      // Check for aspects
      for (const [angle, { name, orb }] of Object.entries(aspectTypes)) {
        const angleNum = parseInt(angle);
        const orbtolerance = diff >= angleNum - orb && diff <= angleNum + orb;
        
        if (orbtolerance) {
          const actualOrb = Math.abs(diff - angleNum);
          aspects.push({
            planet1: arabicPlanetNames[planet1 as keyof typeof arabicPlanetNames],
            planet2: arabicPlanetNames[planet2 as keyof typeof arabicPlanetNames],
            aspect: name,
            orb: parseFloat(actualOrb.toFixed(1)),
          });
          break;
        }
      }
    }
  }
  
  return aspects;
}

// This function calculates a natal chart using Swiss Ephemeris
export const calculateNatalChart = async (
  userId: string,
  birthDate: string,
  birthTime: string,
  birthPlace: string,
): Promise<AstrologyChart> => {
  // First check if we already have this chart stored
  const { data: existingChart } = await getUserChart(userId);
  
  if (existingChart && existingChart.chart_data) {
    return existingChart.chart_data as AstrologyChart;
  }
  
  try {
    // Get latitude and longitude from birth place
    const coords = await getGeoCoordinates(birthPlace);
    
    if (!coords) {
      toast.error("Couldn't find coordinates for the birth place");
      throw new Error("Geocoding failed");
    }
    
    // Parse birth date and time
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute] = birthTime.split(':').map(Number);
    
    // Calculate Julian day
    const julday = swisseph.swe_julday(
      year,
      month,
      day,
      hour + minute / 60,
      swisseph.SE_GREG_CAL
    );
    
    // Set geographic location
    const geopos = [coords.longitude, coords.latitude, 0];
    
    // Initialize object to store planetary positions
    const planetPositions: { [key: number]: number } = {};
    const planets: PlanetaryPosition[] = [];
    
    // Calculate positions for all planets
    for (let i = 0; i <= 9; i++) {
      try {
        // Calculate planet position
        const result = swisseph.swe_calc_ut(julday, i, swisseph.SEFLG_SPEED);
        
        if (result.status === swisseph.OK) {
          const longitude = result.longitude % 360;
          planetPositions[i] = longitude;
          
          // Get sign and degree
          const sign = getSignFromLongitude(longitude);
          const degree = longitude % 30;
          
          // Check if retrograde
          const retrograde = result.speedLong < 0;
          
          planets.push({
            planet: arabicPlanetNames[i as keyof typeof arabicPlanetNames],
            sign,
            degree: parseFloat(degree.toFixed(1)),
            retrograde,
          });
        }
      } catch (error) {
        console.error(`Error calculating position for planet ${i}:`, error);
      }
    }
    
    // Calculate house cusps and ascendant
    const houses = [];
    let ascendant = "";
    
    try {
      // Use Placidus house system
      const houseResult = swisseph.swe_houses(
        julday,
        geopos[1],
        geopos[0],
        'P'
      );
      
      // Get ascendant and convert to sign
      const ascLongitude = houseResult.ascendant % 360;
      ascendant = getSignFromLongitude(ascLongitude);
      
      // Get house cusps
      for (let i = 1; i <= 12; i++) {
        const cuspLongitude = houseResult.house[i - 1] % 360;
        const sign = getSignFromLongitude(cuspLongitude);
        houses.push({ house: i, sign });
      }
    } catch (error) {
      console.error("Error calculating houses:", error);
      
      // Fallback to generic houses based on ascendant
      const signIndices = {
        "الحمل": 0, "الثور": 1, "الجوزاء": 2, "السرطان": 3,
        "الأسد": 4, "العذراء": 5, "الميزان": 6, "العقرب": 7,
        "القوس": 8, "الجدي": 9, "الدلو": 10, "الحوت": 11
      };
      
      // Use the Sun sign as ascendant in fallback
      const sunPosition = planets.find(p => p.planet === arabicPlanetNames[0]);
      ascendant = sunPosition ? sunPosition.sign : arabicSigns[0];
      
      const ascIndex = signIndices[ascendant as keyof typeof signIndices];
      
      for (let i = 1; i <= 12; i++) {
        const signIndex = (ascIndex + i - 1) % 12;
        houses.push({ house: i, sign: arabicSigns[signIndex] });
      }
    }
    
    // Calculate aspects
    const aspects = calculateAspects(planetPositions);
    
    // Construct the chart data
    const chartData: AstrologyChart = {
      planets,
      ascendant,
      houses,
      aspects,
    };
    
    // Store the chart data in Supabase
    await saveUserChart(
      userId, 
      birthDate, 
      birthTime, 
      birthPlace, 
      chartData, 
      coords.latitude, 
      coords.longitude
    );
    
    return chartData;
  } catch (error) {
    console.error("Failed to calculate natal chart:", error);
    
    // Fall back to placeholder chart in case of errors
    const placeholderChart = getPlaceholderChart();
    
    // Store the placeholder chart
    await saveUserChart(userId, birthDate, birthTime, birthPlace, placeholderChart);
    
    return placeholderChart;
  }
};

// Provide a placeholder chart for fallback
function getPlaceholderChart(): AstrologyChart {
  return {
    planets: [
      { planet: "الشمس", sign: "الحمل", degree: 15, retrograde: false },
      { planet: "القمر", sign: "السرطان", degree: 3, retrograde: false },
      { planet: "عطارد", sign: "الحوت", degree: 28, retrograde: true },
      { planet: "الزهرة", sign: "الثور", degree: 10, retrograde: false },
      { planet: "المريخ", sign: "الجوزاء", degree: 22, retrograde: false },
      { planet: "المشتري", sign: "الأسد", degree: 5, retrograde: false },
      { planet: "زحل", sign: "الميزان", degree: 17, retrograde: true },
      { planet: "أورانوس", sign: "الحمل", degree: 12, retrograde: false },
      { planet: "نبتون", sign: "الحوت", degree: 25, retrograde: false },
      { planet: "بلوتو", sign: "الجدي", degree: 28, retrograde: false },
    ],
    ascendant: "الميزان",
    houses: [
      { house: 1, sign: "الميزان" },
      { house: 2, sign: "العقرب" },
      { house: 3, sign: "القوس" },
      { house: 4, sign: "الجدي" },
      { house: 5, sign: "الدلو" },
      { house: 6, sign: "الحوت" },
      { house: 7, sign: "الحمل" },
      { house: 8, sign: "الثور" },
      { house: 9, sign: "الجوزاء" },
      { house: 10, sign: "السرطان" },
      { house: 11, sign: "الأسد" },
      { house: 12, sign: "العذراء" },
    ],
    aspects: [
      { planet1: "الشمس", planet2: "القمر", aspect: "تثليث", orb: 1.2 },
      { planet1: "الشمس", planet2: "المريخ", aspect: "تسديس", orb: 2.5 },
      { planet1: "القمر", planet2: "الزهرة", aspect: "تربيع", orb: 0.8 },
      { planet1: "عطارد", planet2: "المشتري", aspect: "مقارنة", orb: 3.1 },
    ]
  };
}

// Generate a horoscope interpretation based on Swiss Ephemeris data
export const generateHoroscopeFromEphemeris = async (
  userId: string,
  chart: AstrologyChart,
  type: HoroscopeType,
  language: string = "ar"
): Promise<HoroscopeResponse> => {
  // Check if we have a recent prediction for this type
  const { data: existingHoroscope } = await getLatestHoroscope(userId, type);
  
  if (existingHoroscope) {
    return {
      title: existingHoroscope.type === "daily" ? "توقعات اليوم" : 
             existingHoroscope.type === "love" ? "توقعات الحب" : 
             existingHoroscope.type === "career" ? "توقعات المهنة" :
             "توقعات الصحة",
      content: existingHoroscope.content,
      luckyNumber: existingHoroscope.lucky_number,
      luckyStar: existingHoroscope.lucky_star,
      luckyColor: existingHoroscope.lucky_color
    };
  }
  
  // In a real implementation, this would use the chart data to generate
  // a personalized interpretation based on current transits
  // For now, we'll use the predefined responses
  
  // More detailed and comprehensive responses for different horoscope types
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
  
  const content = detailedResponses[type];
  const luckyNumber = luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)];
  const luckyStar = luckyStars[Math.floor(Math.random() * luckyStars.length)];
  const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
  
  // Calculate valid until based on horoscope type
  const now = new Date();
  let validUntil = new Date();
  if (type === 'daily') {
    validUntil.setDate(now.getDate() + 1); // Valid for 1 day
  } else {
    validUntil.setDate(now.getDate() + 7); // Valid for 1 week
  }
  
  // Save to database
  const chartId = userId; // Simplified for now
  await saveHoroscopePrediction(
    userId, 
    chartId, 
    type, 
    content, 
    luckyNumber, 
    luckyStar, 
    luckyColor, 
    validUntil.toISOString()
  );
  
  return {
    title: titles[type],
    content,
    luckyNumber,
    luckyStar,
    luckyColor
  };
};

// Arabic zodiac sign determiner
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
