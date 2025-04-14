
import swisseph from "swisseph";
import { HoroscopeResponse, HoroscopeType, Dialect } from "@/types";
import { getDialectExample } from "./dialect-utils";

// Initialize Swiss Ephemeris
swisseph.swe_set_ephe_path(null);

// Zodiac signs in Arabic
const zodiacSigns = [
  "الحمل", "الثور", "الجوزاء", "السرطان", 
  "الأسد", "العذراء", "الميزان", "العقرب", 
  "القوس", "الجدي", "الدلو", "الحوت"
];

// Planet names in Arabic
const planetNames = {
  0: "الشمس",  // Sun
  1: "القمر",  // Moon
  2: "عطارد",  // Mercury
  3: "الزهرة",  // Venus
  4: "المريخ",  // Mars
  5: "المشتري",  // Jupiter
  6: "زحل",   // Saturn
  7: "أورانوس",  // Uranus
  8: "نبتون",  // Neptune
  9: "بلوتو"   // Pluto
};

// Calculate Julian day from date and time
function getJulianDay(dateStr: string, timeStr: string, longitude: number = 0): number {
  const [year, month, day] = dateStr.split("-").map(n => parseInt(n, 10));
  const [hour, minute] = timeStr.split(":").map(n => parseInt(n, 10));
  
  // Calculate Julian day
  const julDay = swisseph.swe_julday(
    year,
    month,
    day,
    hour + minute / 60.0,
    swisseph.SE_GREG_CAL
  );
  
  // Adjust for time zone
  // Note: longitude is used as an approximation for timezone
  // In a production environment, use a timezone database
  const timezoneOffset = longitude / 15.0;  // Rough estimate: 15° = 1 hour
  
  return julDay - (timezoneOffset / 24.0);
}

// Get coordinates from birth place name
// Since we're not using geocoding API anymore, this is a simple placeholder
// In real app, you'd want to use a geocoding service or let users input coordinates
function getCoordinates(birthPlace: string): { latitude: number, longitude: number } {
  // Default coordinates (0, 0) as fallback
  const defaultCoords = { latitude: 0, longitude: 0 };
  
  // Some placeholder major cities for demonstration
  const cities: Record<string, { latitude: number, longitude: number }> = {
    "القاهرة": { latitude: 30.0444, longitude: 31.2357 },
    "دبي": { latitude: 25.2048, longitude: 55.2708 },
    "الرياض": { latitude: 24.7136, longitude: 46.6753 },
    "بيروت": { latitude: 33.8938, longitude: 35.5018 },
    "بغداد": { latitude: 33.3152, longitude: 44.3661 },
    "طرابلس": { latitude: 32.8872, longitude: 13.1913 },
    "الدار البيضاء": { latitude: 33.5731, longitude: -7.5898 },
    "الجزائر": { latitude: 36.7538, longitude: 3.0588 },
    "تونس": { latitude: 36.8065, longitude: 10.1815 },
    // Add more cities as needed
  };
  
  // Check if birthplace matches any known city
  if (cities[birthPlace]) {
    return cities[birthPlace];
  }
  
  console.log(`No coordinates found for ${birthPlace}, using default coordinates`);
  return defaultCoords;
}

// Calculate planetary positions
function calculatePlanetaryPositions(julDay: number) {
  const planets = [];
  
  // Calculate positions for each planet
  for (let i = 0; i <= 9; i++) {
    // Skip Earth (SE_EARTH = 3 in Swiss Ephemeris)
    if (i === 3) continue;
    
    try {
      const result = swisseph.swe_calc_ut(julDay, i, swisseph.SEFLG_SPEED);
      
      // Check result
      if (result && 'longitude' in result) {
        const longitude = result.longitude;
        const signIndex = Math.floor(longitude / 30);
        const degree = longitude % 30;
        // In newer versions, it's longitudeSpeed
        const retrograde = result.longitudeSpeed < 0 || ('speedLong' in result && result.speedLong < 0);
        
        planets.push({
          planet: planetNames[i] || `Planet ${i}`,
          sign: zodiacSigns[signIndex],
          degree: parseFloat(degree.toFixed(2)),
          retrograde: retrograde
        });
      } else {
        console.error(`Error calculating position for planet ${i}: Invalid result structure`, result);
      }
    } catch (error) {
      console.error(`Error calculating position for planet ${i}:`, error);
    }
  }
  
  return planets;
}

// Calculate house cusps
function calculateHouses(julDay: number, latitude: number, longitude: number) {
  const houses = [];
  const result = swisseph.swe_houses(
    julDay,
    latitude,
    longitude,
    'P'  // Placidus house system
  );
  
  if (result && 'house' in result) {
    for (let i = 1; i <= 12; i++) {
      const longitude = result.house[i - 1];
      const signIndex = Math.floor(longitude / 30);
      houses.push({
        house: i,
        sign: zodiacSigns[signIndex]
      });
    }
  } else {
    console.error("Error calculating houses:", result);
  }
  
  return houses;
}

// Calculate the ascendant
function calculateAscendant(julDay: number, latitude: number, longitude: number) {
  const result = swisseph.swe_houses(
    julDay,
    latitude,
    longitude,
    'P'  // Placidus house system
  );
  
  if (result && 'ascendant' in result) {
    const ascLongitude = result.ascendant;
    const signIndex = Math.floor(ascLongitude / 30);
    return zodiacSigns[signIndex];
  }
  
  return "Unknown";
}

// Calculate aspects between planets
function calculateAspects(planets) {
  const aspects = [];
  const aspectDefs = [
    { name: "مقارنة", angle: 0, orb: 8 },    // Conjunction
    { name: "تسديس", angle: 60, orb: 6 },   // Sextile
    { name: "تربيع", angle: 90, orb: 7 },   // Square
    { name: "تثليث", angle: 120, orb: 8 },  // Trine
    { name: "تقابل", angle: 180, orb: 8 },  // Opposition
  ];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      // Calculate the difference in longitude
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      // Calculate positions in degrees within the entire zodiac
      const pos1 = zodiacSigns.indexOf(planet1.sign) * 30 + planet1.degree;
      const pos2 = zodiacSigns.indexOf(planet2.sign) * 30 + planet2.degree;
      
      // Find the smallest angle between the two positions
      let diff = Math.abs(pos1 - pos2);
      if (diff > 180) diff = 360 - diff;
      
      // Check for aspects
      for (const aspectDef of aspectDefs) {
        const orb = Math.abs(diff - aspectDef.angle);
        if (orb <= aspectDef.orb) {
          aspects.push({
            planet1: planet1.planet,
            planet2: planet2.planet,
            aspect: aspectDef.aspect,
            orb: parseFloat(orb.toFixed(2))
          });
          break;  // Only count the closest aspect
        }
      }
    }
  }
  
  return aspects;
}

// Calculate natal chart
export const calculateNatalChart = async (
  userId: string,
  birthDate: string, 
  birthTime: string, 
  birthPlace: string
): Promise<any> => {
  try {
    console.log(`Calculating natal chart for: ${birthDate} ${birthTime} ${birthPlace}`);
    
    // Get coordinates from birth place
    const { latitude, longitude } = getCoordinates(birthPlace);
    console.log(`Coordinates: lat=${latitude}, long=${longitude}`);
    
    // Calculate Julian day
    const julDay = getJulianDay(birthDate, birthTime, longitude);
    console.log(`Julian day: ${julDay}`);
    
    // Calculate planetary positions
    const planets = calculatePlanetaryPositions(julDay);
    
    // Calculate houses
    const houses = calculateHouses(julDay, latitude, longitude);
    
    // Calculate ascendant
    const ascendant = calculateAscendant(julDay, latitude, longitude);
    
    // Calculate aspects
    const aspects = calculateAspects(planets);
    
    // Create the complete chart
    const chart = {
      planets,
      houses,
      ascendant,
      aspects,
      julDay // Add julDay for use in horoscope generation
    };
    
    return chart;
  } catch (error) {
    console.error("Error calculating birth chart:", error);
    
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
      ],
      julDay: 2459000.5 // placeholder Julian day
    };
  }
};

// Generate horoscope from ephemeris data
export const generateHoroscopeFromEphemeris = async (
  userId: string,
  chart: any,
  type: HoroscopeType,
  dialect: Dialect
): Promise<HoroscopeResponse> => {
  try {
    console.log(`Generating ${type} horoscope with ${dialect} dialect`);

    // Get some basic planet positions from chart
    const sun = chart.planets.find(p => p.planet === "الشمس");
    const moon = chart.planets.find(p => p.planet === "القمر");
    const mercury = chart.planets.find(p => p.planet === "عطارد");
    const jupiter = chart.planets.find(p => p.planet === "المشتري");
    const saturn = chart.planets.find(p => p.planet === "زحل");
    const mars = chart.planets.find(p => p.planet === "المريخ");
    const venus = chart.planets.find(p => p.planet === "الزهرة");
    const julDay = chart.julDay || 2459000.5; // use provided julDay or fallback
    
    // Logic for creating horoscope content based on type and planets
    let content = "";
    
    const titles = {
      daily: "توقعات اليوم",
      love: "توقعات الحب والعلاقات",
      career: "توقعات العمل والمهنة",
      health: "توقعات الصحة والعافية"
    };
    
    // Generate dynamic content based on planet positions and chart
    if (type === "daily") {
      const sunInFire = ["الحمل", "الأسد", "القوس"].includes(sun?.sign || "");
      const moonInWater = ["السرطان", "العقرب", "الحوت"].includes(moon?.sign || "");
      
      if (sunInFire) {
        content = "طاقتك مرتفعة اليوم، يمكنك إنجاز الكثير من المهام. استغل هذه الطاقة في تحقيق أهدافك.";
      } else if (moonInWater) {
        content = "أنت أكثر حساسية للمشاعر اليوم. خذ وقتًا للتأمل والاسترخاء، واهتم بصحتك النفسية.";
      } else if (mercury?.retrograde) {
        content = "قد تواجه بعض سوء التفاهم في التواصل. تأكد من التحقق من المعلومات مرتين قبل اتخاذ القرارات.";
      } else {
        content = "يوم متوازن، مناسب للقيام بالأنشطة الاعتيادية. يمكنك التركيز على أهدافك بشكل جيد.";
      }
    } else if (type === "love") {
      const venusInLove = ["الميزان", "الثور"].includes(venus?.sign || "");
      
      if (venusInLove) {
        content = "العلاقات العاطفية مزدهرة اليوم. إنه وقت مثالي للتعبير عن مشاعرك وتعميق الروابط مع شريك حياتك.";
      } else if (mars?.retrograde) {
        content = "قد تشعر بالتردد في أمور القلب. خذ وقتك ولا تتسرع في اتخاذ قرارات عاطفية مهمة.";
      } else {
        content = "فترة مناسبة للتعارف والتواصل العاطفي. كن منفتحًا على تجارب جديدة في حياتك العاطفية.";
      }
    } else if (type === "career") {
      const jupiterPositive = chart.aspects.some(a => 
        a.planet1 === "المشتري" && ["تثليث", "تسديس"].includes(a.aspect)
      );
      
      if (jupiterPositive) {
        content = "فرص مهنية جيدة في الأفق. استعد للاستفادة من الفرص التي قد تأتي إليك، وكن جاهزًا للتقدم في مسارك المهني.";
      } else if (saturn?.retrograde) {
        content = "تواجه بعض العقبات في العمل. الصبر والمثابرة هما مفتاح النجاح في هذه المرحلة.";
      } else {
        content = "ركز على تحسين مهاراتك وتوسيع شبكة علاقاتك المهنية. قد تأتي فرص جديدة من مصادر غير متوقعة.";
      }
    } else if (type === "health") {
      const moonPhase = Math.floor((julDay % 29.53) / 29.53 * 8);
      
      if (moonPhase < 2) {  // New moon
        content = "وقت مناسب لبدء عادات صحية جديدة. ركز على بناء روتين صحي واتبعه بانتظام.";
      } else if (moonPhase > 5) {  // Waning moon
        content = "جسمك يحتاج إلى الراحة. خذ قسطًا كافيًا من النوم واهتم بالاسترخاء والتأمل.";
      } else {
        content = "توازن بين النشاط البدني والراحة. تناول طعامًا صحيًا وحافظ على ترطيب جسمك.";
      }
    }
    
    // Randomize some elements to make it feel dynamic
    const luckyNumbers = [3, 7, 9, 12, 21, 33];
    const luckyStars = ["المشتري", "الزهرة", "الشمس", "عطارد", "القمر"];
    const luckyColors = ["الأزرق", "الأخضر", "الذهبي", "الفضي", "الأرجواني"];
    
    return {
      title: titles[type],
      content: content,
      luckyNumber: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
      luckyStar: luckyStars[Math.floor(Math.random() * luckyStars.length)],
      luckyColor: luckyColors[Math.floor(Math.random() * luckyColors.length)]
    };
  } catch (error) {
    console.error("Error generating horoscope from ephemeris:", error);
    
    // Return a fallback response
    return {
      title: type === "daily" ? "توقعات اليوم" : 
             type === "love" ? "توقعات الحب والعلاقات" : 
             type === "career" ? "توقعات العمل والمهنة" : "توقعات الصحة والعافية",
      content: getDialectExample(dialect),
      luckyNumber: 7,
      luckyStar: "المشتري",
      luckyColor: "الأزرق"
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
