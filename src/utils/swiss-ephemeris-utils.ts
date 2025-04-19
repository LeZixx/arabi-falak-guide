
/**
 * Integration with AstroHabibi API for astrological calculations
 */

import { HoroscopeResponse, HoroscopeType, Dialect } from "@/types";
import { getDialectExample } from "./dialect-utils";
import { toast } from "sonner";

// API endpoints for chart calculations
const NATAL_CHART_API_URL = "https://astrohabibiapi-564958434402.me-central1.run.app/natal-chart";
const FULL_CHART_API_URL = "https://astrohabibiapi-564958434402.me-central1.run.app/full-chart";

// Zodiac signs in Arabic
const zodiacSigns = [
  "الحمل", "الثور", "الجوزاء", "السرطان", 
  "الأسد", "العذراء", "الميزان", "العقرب", 
  "القوس", "الجدي", "الدلو", "الحوت"
];

// Planet names in Arabic
const planetNames = {
  "Sun": "الشمس",
  "Moon": "القمر",
  "Mercury": "عطارد",
  "Venus": "الزهرة",
  "Mars": "المريخ",
  "Jupiter": "المشتري",
  "Saturn": "زحل",
  "Uranus": "أورانوس",
  "Neptune": "نبتون",
  "Pluto": "بلوتو",
  "Chiron": "كيرون",
  "North Node": "العقدة الشمالية",
  "South Node": "العقدة الجنوبية"
};

// House names in Arabic
const houseNames = {
  "1": "البيت الأول",
  "2": "البيت الثاني",
  "3": "البيت الثالث",
  "4": "البيت الرابع",
  "5": "البيت الخامس",
  "6": "البيت السادس",
  "7": "البيت السابع",
  "8": "البيت الثامن",
  "9": "البيت التاسع",
  "10": "البيت العاشر",
  "11": "البيت الحادي عشر",
  "12": "البيت الثاني عشر"
};

// Function to calculate natal chart using AstroHabibi API
export const calculateNatalChart = async (
  userId: string,
  birthDate: string, 
  birthTime: string, 
  birthPlace: string
): Promise<any> => {
  console.log(`Fetching chart data from API for: ${birthDate} ${birthTime} ${birthPlace}`);
  
  try {
    // Step 1: Get coordinates from the birth place
    const coordinates = await getLocationCoordinates(birthPlace);
    
    if (!coordinates) {
      console.error("Could not get coordinates for location:", birthPlace);
      throw new Error(`Could not get coordinates for location: ${birthPlace}`);
    }
    
    // Format date for API (YYYY-MM-DD)
    const formattedDate = formatDateForAPI(birthDate);
    
    // Make sure time is in 24h format (HH:mm)
    const formattedTime = formatTimeForAPI(birthTime);

    // Get timezone (simplified - would ideally use a timezone API)
    const timezone = "UTC"; // Default fallback
    
    // Step 2: Call the natal-chart API endpoint
    const natalChartPayload = {
      date: formattedDate,
      time: formattedTime,
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      timezone: timezone
    };
    
    console.log("Sending payload to natal-chart API:", JSON.stringify(natalChartPayload));
    
    const natalChartResponse = await fetch(NATAL_CHART_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(natalChartPayload)
    });
    
    // Check if response was OK
    if (!natalChartResponse.ok) {
      const errorText = await natalChartResponse.text();
      console.error(`API returned status ${natalChartResponse.status}:`, errorText);
      throw new Error(`API error: ${natalChartResponse.status}. Message: ${errorText || 'Unknown error'}`);
    }
    
    // Get response text and parse as JSON
    const natalChartData = await natalChartResponse.json();
    console.log("natal-chart API response:", JSON.stringify(natalChartData));
    
    // Validate the API response
    if (!natalChartData.julianDay || !natalChartData.coordinates) {
      console.error("API response missing required fields:", natalChartData);
      throw new Error("API response missing critical fields (julianDay, coordinates)");
    }
    
    // Step 3: Use the julianDay from the response to call the full-chart API
    const fullChartPayload = {
      julianDay: natalChartData.julianDay,
      lat: natalChartData.coordinates.latitude,
      lon: natalChartData.coordinates.longitude
    };
    
    console.log("Sending payload to full-chart API:", JSON.stringify(fullChartPayload));
    console.log("VERIFICATION - Using exact Julian Day from API:", natalChartData.julianDay);
    
    const fullChartResponse = await fetch(FULL_CHART_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(fullChartPayload)
    });
    
    // Check if response was OK
    if (!fullChartResponse.ok) {
      const errorText = await fullChartResponse.text();
      console.error(`full-chart API returned status ${fullChartResponse.status}:`, errorText);
      throw new Error(`full-chart API error: ${fullChartResponse.status}. Message: ${errorText || 'Unknown error'}`);
    }
    
    // Get full chart data
    const fullChartData = await fullChartResponse.json();
    console.log("full-chart API response:", JSON.stringify(fullChartData));
    
    // Combine data from both API responses
    const chart = processFullChartData(fullChartData, natalChartData.julianDay);
    
    // Log key positions for verification
    const sunPosition = chart.planets.find(p => p.planet === "الشمس");
    const moonPosition = chart.planets.find(p => p.planet === "القمر");
    
    console.log("VERIFICATION - Calculated positions based on Julian Day", natalChartData.julianDay);
    console.log(`VERIFICATION - Sun: ${sunPosition?.sign} at ${sunPosition?.degree.toFixed(2)}°`);
    console.log(`VERIFICATION - Moon: ${moonPosition?.sign} at ${moonPosition?.degree.toFixed(2)}°`);
    console.log(`VERIFICATION - Ascendant (Rising): ${chart.ascendant}`);
    
    return chart;
    
  } catch (error) {
    console.error("Error fetching natal chart:", error);
    toast.error("Failed to fetch astrological data. Please try again later.");
    
    // Return fallback chart data
    return generateFallbackChartData(birthDate);
  }
};

// Process the full chart data from the API
const processFullChartData = (fullChartData: any, julianDay: number): any => {
  try {
    // Map the planets to Arabic names and format them correctly
    const planets = fullChartData.planets.map((planet: any) => {
      return {
        planet: planetNames[planet.name as keyof typeof planetNames] || planet.name,
        sign: mapSignToArabic(planet.sign),
        degree: parseFloat(planet.degree.toFixed(2)),
        retrograde: planet.retrograde
      };
    });
    
    // Map the houses to Arabic names
    const houses = fullChartData.houses.map((house: any) => {
      return {
        house: house.number,
        sign: mapSignToArabic(house.sign),
        degree: parseFloat(house.degree.toFixed(2))
      };
    });
    
    // Extract aspects if available
    const aspects = fullChartData.aspects ? fullChartData.aspects.map((aspect: any) => {
      return {
        planet1: planetNames[aspect.planet1 as keyof typeof planetNames] || aspect.planet1,
        planet2: planetNames[aspect.planet2 as keyof typeof planetNames] || aspect.planet2,
        aspect: translateAspectToArabic(aspect.type),
        orb: parseFloat(aspect.orb.toFixed(1))
      };
    }) : [];
    
    return {
      timestamp: new Date().toISOString(),
      julianDay,
      planets,
      houses,
      ascendant: mapSignToArabic(fullChartData.ascendant?.sign || ""),
      midheaven: mapSignToArabic(fullChartData.midheaven?.sign || ""),
      aspects
    };
  } catch (error) {
    console.error("Error processing full chart data:", error);
    throw new Error("Failed to process chart data from API");
  }
};

// Map zodiac sign names to Arabic
const mapSignToArabic = (sign: string): string => {
  const signMap: Record<string, string> = {
    "Aries": "الحمل",
    "Taurus": "الثور",
    "Gemini": "الجوزاء",
    "Cancer": "السرطان",
    "Leo": "الأسد",
    "Virgo": "العذراء",
    "Libra": "الميزان",
    "Scorpio": "العقرب",
    "Sagittarius": "القوس",
    "Capricorn": "الجدي",
    "Aquarius": "الدلو",
    "Pisces": "الحوت"
  };
  
  return signMap[sign] || sign;
};

// Translate aspect type to Arabic
const translateAspectToArabic = (aspectType: string): string => {
  const aspectMap: Record<string, string> = {
    "conjunction": "اقتران",
    "opposition": "مقابلة",
    "trine": "تثليث",
    "square": "تربيع",
    "sextile": "سداسي",
    "quincunx": "خماسي",
    "semisextile": "نصف سداسي",
    "sesquisquare": "مربع ونصف",
    "semisquare": "نصف مربع"
  };
  
  return aspectMap[aspectType.toLowerCase()] || aspectType;
};

// Generate fallback chart data if API fails
const generateFallbackChartData = (birthDate: string): any => {
  console.warn("Generating fallback chart data as API request failed");
  
  // Use birth date to determine Sun sign
  const zodiacSign = getZodiacSign(birthDate);
  const signIndex = zodiacSigns.indexOf(zodiacSign);
  
  // Generate planetary positions based on Sun sign
  const planets = [
    { planet: "الشمس", sign: zodiacSign, degree: 15.0, retrograde: false },
    { planet: "القمر", sign: zodiacSigns[(signIndex + 2) % 12], degree: 10.5, retrograde: false },
    { planet: "عطارد", sign: zodiacSigns[(signIndex + 1) % 12], degree: 5.2, retrograde: false },
    { planet: "الزهرة", sign: zodiacSigns[(signIndex + 3) % 12], degree: 22.8, retrograde: false },
    { planet: "المريخ", sign: zodiacSigns[(signIndex + 4) % 12], degree: 18.3, retrograde: false },
    { planet: "المشتري", sign: zodiacSigns[(signIndex + 6) % 12], degree: 9.7, retrograde: false },
    { planet: "زحل", sign: zodiacSigns[(signIndex + 8) % 12], degree: 27.4, retrograde: true },
    { planet: "أورانوس", sign: zodiacSigns[(signIndex + 9) % 12], degree: 3.1, retrograde: false },
    { planet: "نبتون", sign: zodiacSigns[(signIndex + 10) % 12], degree: 12.6, retrograde: true },
    { planet: "بلوتو", sign: zodiacSigns[(signIndex + 11) % 12], degree: 8.9, retrograde: false }
  ];
  
  // Generate house positions
  const houses = Array.from({ length: 12 }, (_, i) => {
    return {
      house: i + 1,
      sign: zodiacSigns[(signIndex + i) % 12]
    };
  });
  
  return {
    timestamp: new Date().toISOString(),
    julianDay: 0, // Placeholder
    planets,
    houses,
    ascendant: zodiacSigns[signIndex],
    aspects: []
  };
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
  // If time is empty, use noon as default
  if (!timeString || timeString.trim() === "") {
    return "12:00";
  }
  
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

// Generate birth chart interpretation
export const generateBirthChartInterpretation = (chart: any, hasBirthTime: boolean): string => {
  if (!chart || !chart.planets || chart.planets.length === 0) {
    return "لم نتمكن من حساب خريطتك الفلكية. يرجى التأكد من صحة بيانات الميلاد.";
  }

  // Get sun, moon and ascendant for the overview
  const sun = chart.planets.find(p => p.planet === "الشمس");
  const moon = chart.planets.find(p => p.planet === "القمر");
  const mercury = chart.planets.find(p => p.planet === "عطارد");
  
  let interpretation = `✨ تحليل خريطتك الفلكية الشخصية ✨\n\n`;
  
  // Overview section
  interpretation += `🪐 نظرة عامة:\n`;
  interpretation += `شمسك في برج ${sun?.sign || "غير معروف"} تعكس جوهر شخصيتك وقوتك الحيوية.\n`;
  interpretation += `قمرك في برج ${moon?.sign || "غير معروف"} يعبر عن عواطفك واحتياجاتك العاطفية.\n`;
  
  if (hasBirthTime && chart.ascendant) {
    interpretation += `طالعك (الصاعد) في برج ${chart.ascendant} يمثل شخصيتك الظاهرة والانطباع الأول الذي تتركه.\n\n`;
  } else {
    interpretation += `\n⚠️ لم يتم تحديد وقت الميلاد بدقة، لذلك لا يمكن حساب الطالع (الصاعد) وبيوت الخريطة بدقة.\n\n`;
  }
  
  // Detailed planet section
  interpretation += `💫 تفاصيل الكواكب:\n\n`;
  
  chart.planets.forEach((planet: any) => {
    interpretation += `• ${planet.planet} في برج ${planet.sign} عند ${planet.degree.toFixed(1)}° ${planet.retrograde ? "(تراجع) ☿ᴿ" : ""}\n`;
    
    // Add meaning for each planet
    switch (planet.planet) {
      case "الشمس":
        interpretation += `  يعكس هذا الموقع ${getPlanetInSignMeaning("الشمس", planet.sign)}\n\n`;
        break;
      case "القمر":
        interpretation += `  ${getPlanetInSignMeaning("القمر", planet.sign)}\n\n`;
        break;
      case "عطارد":
        interpretation += `  ${getPlanetInSignMeaning("عطارد", planet.sign)} ${planet.retrograde ? "وجود عطارد في حالة تراجع قد يشير إلى تحديات في التواصل وفترات من إعادة التفكير." : ""}\n\n`;
        break;
      case "الزهرة":
        interpretation += `  ${getPlanetInSignMeaning("الزهرة", planet.sign)}\n\n`;
        break;
      case "المريخ":
        interpretation += `  ${getPlanetInSignMeaning("المريخ", planet.sign)}\n\n`;
        break;
      default:
        interpretation += `  هذا الموقع يؤثر على جوانب مختلفة من حياتك وشخصيتك.\n\n`;
    }
  });
  
  // Houses interpretation if birth time is available
  if (hasBirthTime && chart.houses && chart.houses.length > 0) {
    interpretation += `🏠 بيوت الخريطة الفلكية:\n\n`;
    
    // Describe key houses
    for (let i = 0; i < Math.min(chart.houses.length, 12); i++) {
      const house = chart.houses[i];
      interpretation += `• ${houseNames[house.house.toString() as keyof typeof houseNames] || `البيت ${house.house}`} في برج ${house.sign}: ${getHouseMeaning(house.house)}\n\n`;
    }
  }
  
  // Ascendant & Midheaven interpretations if birth time is available
  if (hasBirthTime && chart.ascendant) {
    interpretation += `🔭 الطالع والقمة السماوية:\n\n`;
    interpretation += `• الطالع (الصاعد) في برج ${chart.ascendant}: ${getAscendantMeaning(chart.ascendant)}\n\n`;
    
    if (chart.midheaven) {
      interpretation += `• القمة السماوية (MC) في برج ${chart.midheaven}: ${getMidheavenMeaning(chart.midheaven)}\n\n`;
    }
  }
  
  // Psychological profile
  interpretation += `🧠 الملف النفسي:\n\n`;
  interpretation += generatePsychologicalProfile(chart);
  
  // Life potentials
  interpretation += `❤️ إمكانيات الحياة:\n\n`;
  interpretation += `• الحب والعلاقات: ${getLoveCompatibility(chart)}\n\n`;
  interpretation += `• المسار المهني: ${getCareerPotential(chart)}\n\n`;
  interpretation += `• مسار الحياة: ${getLifePathPotential(chart)}\n\n`;
  
  // Notable planetary patterns
  interpretation += `🌟 أنماط كوكبية ملحوظة:\n\n`;
  interpretation += generateNotablePatterns(chart);
  
  return interpretation;
};

// Helper functions for birth chart interpretation
const getPlanetInSignMeaning = (planet: string, sign: string): string => {
  const meanings: Record<string, Record<string, string>> = {
    "الشمس": {
      "الحمل": "قوة الإرادة والحماس والطاقة المتدفقة. أنت قائد بطبعك، مستقل وتبحث عن التحديات.",
      "الثور": "الثبات والعملية والصبر. تقدر الأمن المادي والراحة وتتمتع بقوة إرادة كبيرة.",
      "الجوزاء": "الفضول وخفة الروح والذكاء. تحب التواصل وتبادل الأفكار وتتكيف بسرعة مع المواقف المختلفة.",
      "السرطان": "العاطفة والحساسية والرعاية. تهتم بالعائلة والأمن العاطفي وتمتلك ذاكرة قوية.",
      "الأسد": "الكرم والإبداع والثقة بالنفس. تحب أن تكون محط الأنظار وتتمتع بقلب دافئ وشخصية جذابة.",
      "العذراء": "الدقة والتحليل والخدمة. تهتم بالتفاصيل وتسعى للتحسين المستمر وتقدر النظام.",
      "الميزان": "الدبلوماسية والتوازن والجمال. تبحث عن الانسجام في العلاقات وتقدر العدالة.",
      "العقرب": "العمق والتحول والكثافة العاطفية. لديك قوة نفسية كبيرة وقدرة على اختراق سطح الأمور.",
      "القوس": "المغامرة والتفاؤل والحكمة. تبحث عن المعنى الأعمق للحياة وتحب الاستكشاف.",
      "الجدي": "الطموح والمسؤولية والانضباط. تضع أهدافًا عالية وتعمل بجد للوصول إليها.",
      "الدلو": "الأصالة والإنسانية والابتكار. تفكر خارج الصندوق وترى المستقبل بوضوح.",
      "الحوت": "الحدس والرحمة والروحانية. لديك خيال غني وقدرة على فهم معاناة الآخرين."
    },
    "القمر": {
      "الحمل": "تستجيب للمواقف العاطفية بعفوية وحماس، وتحتاج إلى الاستقلالية حتى في علاقاتك القريبة.",
      "الثور": "تشعر بالأمان عندما تكون محاطًا بالراحة المادية والاستقرار، وتتمتع بحاسة تذوق مرهفة.",
      "الجوزاء": "تحتاج إلى التواصل والتنوع لتشعر بالرضا العاطفي، وقد تتقلب مزاجيتك بسرعة.",
      "السرطان": "عواطفك عميقة وحساسة للغاية، وترتبط بشدة بالماضي والذكريات والعائلة.",
      "الأسد": "تحتاج إلى التقدير والاعتراف بقيمتك، وتعبر عن عواطفك بدفء وسخاء كبير.",
      "العذراء": "تستجيب للمشاعر بطريقة منطقية وتحليلية، وتهتم بالتفاصيل الصغيرة في علاقاتك.",
      "الميزان": "تسعى للتوازن والانسجام في حياتك العاطفية، وتكره الصراع والمواجهة.",
      "العقرب": "عواطفك كثيفة وعميقة، وقد تميل إلى كتمان مشاعرك الحقيقية حتى تثق تمامًا بالآخرين.",
      "القوس": "تحتاج إلى الحرية والمساحة في حياتك العاطفية، وتنجذب نحو الثقافات والتجارب الجديدة.",
      "الجدي": "تحتفظ بعواطفك تحت السيطرة، وتقدر التقاليد والأمن العاطفي على المدى الطويل.",
      "الدلو": "تعبر عن مشاعرك بطريقة فريدة وغير تقليدية، وقد تبدو منفصلاً عاطفياً في بعض الأحيان.",
      "الحوت": "عواطفك عميقة وحدسية للغاية، ولديك قدرة كبيرة على التعاطف مع الآخرين."
    },
    "عطارد": {
      "الحمل": "تفكر وتتواصل بسرعة وحماس، قد تكون متسرعًا في الوصول إلى استنتاجات.",
      "الثور": "تفكر بطريقة عملية ومنهجية، وتحتاج إلى وقت لمعالجة المعلومات الجديدة.",
      "الجوزاء": "لديك عقل سريع وفضولي، تستمتع بجمع المعلومات المتنوعة والتحدث عن مواضيع مختلفة.",
      "السرطان": "تفكر بطريقة عاطفية وحدسية، وتتذكر التفاصيل المرتبطة بالمشاعر.",
      "الأسد": "تتواصل بثقة وإبداع، ولديك موهبة في سرد القصص والخطابة.",
      "العذراء": "تحليلي ودقيق في تفكيرك، تهتم بالتفاصيل وتسعى للكمال.",
      "الميزان": "تفكر بطريقة متوازنة وترى وجهات النظر المختلفة، وتجيد فن المفاوضة.",
      "العقرب": "لديك عقل تحليلي عميق، تستمتع بحل الألغاز واكتشاف الأسرار.",
      "القوس": "تفكر بنظرة شمولية فلسفية، وتهتم بالبحث عن الحقائق الكبرى.",
      "الجدي": "منظم ومنهجي في تفكيرك، وتفضل الأفكار العملية والقابلة للتطبيق.",
      "الدلو": "مبتكر وأصيل في أفكارك، قد تكون سابقًا لعصرك في طريقة تفكيرك.",
      "الحوت": "تفكر بطريقة حدسية وخيالية، وتتواصل مع الآخرين على مستوى روحي وعاطفي."
    },
    "الزهرة": {
      "الحمل": "تعبر عن مشاعرك بشكل مباشر وحماسي، وتنجذب إلى العلاقات المليئة بالمغامرات والتحديات.",
      "الثور": "تقدر الراحة والجمال والاستقرار في العلاقات، وتعبر عن الحب من خلال اللمسات المادية والهدايا.",
      "الجوزاء": "تبحث عن التواصل الفكري في العلاقات، وتحتاج إلى شريك يمكنك التحدث معه بحرية.",
      "السرطان": "عاطفي ورعاية في الحب، تهتم بالأمن العاطفي وتقدر العلاقات الأسرية.",
      "الأسد": "تعبر عن الحب بسخاء ودراماتيكية، وتستمتع بالمغازلة وجذب الانتباه.",
      "العذراء": "تحب بطريقة عملية وخدومة، وتهتم بالتفاصيل الصغيرة التي تجعل شريكك سعيدًا.",
      "الميزان": "تبحث عن الانسجام والجمال في العلاقات، وتقدر الدبلوماسية والتوازن.",
      "العقرب": "تحب بشكل عميق وشغوف، وتلتزم بشدة في علاقاتك.",
      "القوس": "تبحث عن الحرية والمغامرة في الحب، وتنجذب إلى العلاقات التي توسع آفاقك.",
      "الجدي": "محافظ ومسؤول في الحب، وتقدر التقاليد والالتزام طويل المدى.",
      "الدلو": "تحب بطريقة فريدة وغير تقليدية، وتقدر الصداقة والحرية في العلاقات.",
      "الحوت": "رومانسي وحساس للغاية، وتبحث عن الاتصال الروحي مع شريكك."
    },
    "المريخ": {
      "الحمل": "تتصرف بجرأة ومباشرة، وتواجه التحديات بحماس وشجاعة.",
      "الثور": "تعمل بثبات ومثابرة، وتظهر قوتك من خلال الصبر والإصرار.",
      "الجوزاء": "تستخدم ذكاءك وسرعة بديهتك في تحقيق أهدافك، وتتعامل مع مشاريع متعددة في نفس الوقت.",
      "السرطان": "تحمي وتدافع عمن تحب بقوة، وتتحرك بدافع من عواطفك وحدسك.",
      "الأسد": "تتصرف بثقة وإبداع، وتحب أن تكون في مركز الأحداث.",
      "العذراء": "تعمل بدقة وكفاءة، وتستخدم تحليلك المنطقي لحل المشكلات.",
      "الميزان": "تسعى للعدالة في أفعالك، وتفضل العمل بالتعاون مع الآخرين.",
      "العقرب": "تمتلك قوة إرادة هائلة وإصرارًا، وتستطيع تحويل المواقف الصعبة لصالحك.",
      "القوس": "تتصرف بروح المغامرة والحماس، وتدافع عن معتقداتك بقوة.",
      "الجدي": "منظم واستراتيجي في أفعالك، وتعمل بجد لتحقيق أهدافك طويلة المدى.",
      "الدلو": "مبتكر وأصلي في نهجك، وقد تناضل من أجل قضايا إنسانية.",
      "الحوت": "تعمل بدافع من حدسك وإلهامك، وتتصرف بطرق غير مباشرة لتحقيق أهدافك."
    }
  };
  
  return meanings[planet]?.[sign] || `تأثير مميز على شخصيتك وحياتك.`;
};

const getHouseMeaning = (houseNumber: number): string => {
  const meanings = [
    "يمثل شخصيتك وكيفية تقديم نفسك للعالم.",
    "يتعلق بالموارد والقيم المادية والأمن المالي.",
    "يرتبط بالتواصل والتعلم والعلاقات مع الإخوة والأخوات.",
    "يمثل المنزل والعائلة والجذور والأساس العاطفي.",
    "يتعلق بالإبداع والحب والأطفال والمتعة.",
    "يرتبط بالصحة والعمل اليومي والخدمة.",
    "يمثل العلاقات الوثيقة والشراكات والزواج.",
    "يتعلق بالتحول والموارد المشتركة والحميمية.",
    "يرتبط بالتوسع الفكري والسفر والفلسفة والتعليم العالي.",
    "يمثل المكانة الاجتماعية والمهنة والسلطة.",
    "يتعلق بالصداقات والمجموعات والأمنيات والأهداف المستقبلية.",
    "يرتبط بالعالم الباطني والروحانيات والتضحية."
  ];
  
  return meanings[houseNumber - 1] || "يؤثر على جانب مهم من حياتك.";
};

const getAscendantMeaning = (ascendantSign: string): string => {
  const meanings: Record<string, string> = {
    "الحمل": "تظهر للآخرين كشخص نشيط ومستقل ومباشر، وقد تبدو أكثر جرأة وثقة مما أنت عليه فعليًا.",
    "الثور": "تظهر بمظهر هادئ وموثوق وعملي، وتعطي انطباعًا بالثبات والصلابة.",
    "الجوزاء": "تبدو اجتماعيًا وفضوليًا ومتواصلًا، وقد يراك الناس كشخص مرح وسريع البديهة.",
    "السرطان": "تظهر كشخص رعاية وعاطفي ومهتم بالآخرين، وقد تبدو أكثر حساسية وخجلًا.",
    "الأسد": "تظهر بثقة وكاريزما وقوة، وتجذب الانتباه بطبيعتك الدافئة والكريمة.",
    "العذراء": "تعطي انطباعًا بالدقة والذكاء والتنظيم، وقد تبدو أكثر تحفظًا وتحليلية.",
    "الميزان": "تظهر كشخص دبلوماسي ولطيف ومتوازن، وتهتم بالعلاقات والانسجام.",
    "العقرب": "تبدو غامضًا وكثيف العواطف ونافذ البصيرة، وقد تخلق هالة من القوة الصامتة.",
    "القوس": "تظهر متفائلًا ومنفتحًا ومغامرًا، وتعطي انطباعًا بالحماس والصدق.",
    "الجدي": "تبدو جديًا ومسؤولًا ومحترفًا، وقد تعطي انطباعًا بالنضج والاحترام.",
    "الدلو": "تظهر أصيلًا وفريدًا ومستقلًا، وقد تبدو أكثر انفصالًا عن العواطف.",
    "الحوت": "تبدو حساسًا وحدسيًا ولطيفًا، وقد تعطي انطباعًا بالغموض والروحانية."
  };
  
  return meanings[ascendantSign] || "يشكل الطريقة التي يراك بها الآخرون عند اللقاء الأول.";
};

const getMidheavenMeaning = (midheavenSign: string): string => {
  const meanings: Record<string, string> = {
    "الحمل": "قد تسعى لمسار مهني يتيح لك الريادة والمبادرة، وتستمتع بالتحديات والفرص الجديدة في عملك.",
    "الثور": "تهتم بالاستقرار المهني والنمو المادي المنتظم، وتفضل المسارات المهنية العملية والمستدامة.",
    "الجوزاء": "قد تنجذب إلى المهن التي تتطلب مهارات تواصل وتنوعًا في المهام، مثل التعليم أو الإعلام.",
    "السرطان": "تميل إلى المهن التي ترتبط بالرعاية والدعم والعائلة، وقد تكون موهوبًا في الأدوار التي تتطلب تعاطفًا.",
    "الأسد": "قد تسعى للمهن التي تضعك في مركز الاهتمام، وتستمتع بالقيادة والإبداع في مسارك المهني.",
    "العذراء": "تتفوق في المهن التي تتطلب دقة وتحليلًا وخدمة، وتنجح في الأدوار التي تتطلب انتباهًا للتفاصيل.",
    "الميزان": "قد تنجذب إلى المهن المرتبطة بالعدالة والجمال والدبلوماسية، وتستمتع بالعمل مع الآخرين.",
    "العقرب": "تميل إلى المهن التي تتضمن البحث والتحقيق والتحول، وقد تكون موهوبًا في مجالات يخشاها الآخرون.",
    "القوس": "قد تسعى للمهن المرتبطة بالتعليم العالي والسفر والفلسفة، وتستمتع بتوسيع آفاقك المهنية.",
    "الجدي": "تهتم بالنجاح المهني والوصول إلى مناصب السلطة، وتعمل بجد لتحقيق أهدافك طويلة المدى.",
    "الدلو": "قد تنجذب إلى المهن المبتكرة والإنسانية والمستقبلية، وتستمتع بالتغيير والتطوير.",
    "الحوت": "تميل إلى المهن المرتبطة بالروحانيات والفنون والخدمة، وقد تكون موهوبًا في المجالات التي تتطلب خيالًا وحدسًا."
  };
  
  return meanings[midheavenSign] || "يؤثر على طموحاتك المهنية ومكانتك الاجتماعية.";
};

const generatePsychologicalProfile = (chart: any): string => {
  // Simple function to generate psychological profile based on key placements
  const sun = chart.planets.find((p: any) => p.planet === "الشمس");
  const moon = chart.planets.find((p: any) => p.planet === "القمر");
  const mercury = chart.planets.find((p: any) => p.planet === "عطارد");
  
  let profile = "";
  
  if (sun && moon) {
    if (sun.sign === moon.sign) {
      profile += `• توافق قوي بين شمسك وقمرك في برج ${sun.sign} يشير إلى انسجام بين هويتك الواعية واحتياجاتك العاطفية. أنت شخص متماسك داخليًا وخارجيًا.\n\n`;
    } else {
      profile += `• شمسك في برج ${sun.sign} وقمرك في برج ${moon.sign} يخلقان ديناميكية مثيرة في شخصيتك. قد تشعر أحيانًا بتناقض بين ما تريد تحقيقه وما تحتاجه عاطفيًا.\n\n`;
    }
  }
  
  if (mercury) {
    if (mercury.retrograde) {
      profile += `• عطارد المتراجع في خريطتك يشير إلى أنك قد تفكر بشكل مختلف عن الآخرين، وتحتاج إلى وقت أطول لمعالجة المعلومات. لديك القدرة على إعادة التفكير في الأمور بشكل عميق.\n\n`;
    } else {
      profile += `• موضع عطارد في برجك يعكس طريقة تفكيرك وتواصلك. أنت تميل إلى ${mercury.sign === "الجوزاء" || mercury.sign === "الميزان" ? "التفكير المنطقي والتحليلي" : "التفكير الحدسي والعاطفي"} في معالجة المعلومات.\n\n`;
    }
  }
  
  // Add more psychological insights based on other placements
  profile += `• تظهر خريطتك الفلكية توازنًا ${getElementBalance(chart)} بين العناصر الأربعة (النار، الأرض، الهواء، الماء)، مما يعكس ${getElementBalanceDescription(chart)}.\n\n`;
  
  return profile;
};

const getElementBalance = (chart: any): string => {
  // Calculate element balance
  const fireCount = countPlanetsInElement(chart, ["الحمل", "الأسد", "القوس"]);
  const earthCount = countPlanetsInElement(chart, ["الثور", "العذراء", "الجدي"]);
  const airCount = countPlanetsInElement(chart, ["الجوزاء", "الميزان", "الدلو"]);
  const waterCount = countPlanetsInElement(chart, ["السرطان", "العقرب", "الحوت"]);
  
  const total = fireCount + earthCount + airCount + waterCount;
  
  if (Math.max(fireCount, earthCount, airCount, waterCount) >= total * 0.5) {
    if (fireCount > earthCount && fireCount > airCount && fireCount > waterCount) {
      return "قويًا نحو عنصر النار";
    } else if (earthCount > fireCount && earthCount > airCount && earthCount > waterCount) {
      return "قويًا نحو عنصر الأرض";
    } else if (airCount > fireCount && airCount > earthCount && airCount > waterCount) {
      return "قويًا نحو عنصر الهواء";
    } else {
      return "قويًا نحو عنصر الماء";
    }
  } else {
    return "معتدلًا";
  }
};

const countPlanetsInElement = (chart: any, signs: string[]): number => {
  return chart.planets.filter((p: any) => signs.includes(p.sign)).length;
};

const getElementBalanceDescription = (chart: any): string => {
  const balance = getElementBalance(chart);
  
  if (balance.includes("النار")) {
    return "طبيعة حماسية ومبادرة ومفعمة بالطاقة والإبداع";
  } else if (balance.includes("الأرض")) {
    return "طبيعة عملية ومستقرة وموثوقة تركز على الجوانب الملموسة في الحياة";
  } else if (balance.includes("الهواء")) {
    return "طبيعة فكرية واجتماعية تهتم بالمفاهيم والتواصل";
  } else if (balance.includes("الماء")) {
    return "طبيعة عاطفية وحدسية وعميقة تتصل بالمشاعر والحدس";
  } else {
    return "شخصية متوازنة تستطيع التكيف مع مختلف المواقف";
  }
};

const getLoveCompatibility = (chart: any): string => {
  const venus = chart.planets.find((p: any) => p.planet === "الزهرة");
  const mars = chart.planets.find((p: any) => p.planet === "المريخ");
  
  if (venus && mars) {
    if (areSignsCompatible(venus.sign, mars.sign)) {
      return `الزهرة في برج ${venus.sign} والمريخ في برج ${mars.sign} يشيران إلى انسجام بين ما تجذبك في الحب وكيف تعبر عن رغباتك. أنت تميل إلى علاقات متناغمة وواضحة.`;
    } else {
      return `الزهرة في برج ${venus.sign} والمريخ في برج ${mars.sign} يخلقان ديناميكية مثيرة في حياتك العاطفية. قد تجد تناقضًا بين ما تنجذب إليه وكيف تتصرف في العلاقات.`;
    }
  }
  
  if (venus) {
    return `الزهرة في برج ${venus.sign} تؤثر على طريقة حبك وما تقدره في العلاقات. أنت تميل إلى ${getVenusDescription(venus.sign)}.`;
  }
  
  return "لديك فهم فريد للحب والعلاقات، وتبحث عن شريك يتفهم احتياجاتك العاطفية.";
};

const areSignsCompatible = (sign1: string, sign2: string): boolean => {
  const fireList = ["الحمل", "الأسد", "القوس"];
  const earthList = ["الثور", "العذراء", "الجدي"];
  const airList = ["الجوزاء", "الميزان", "الدلو"];
  const waterList = ["السرطان", "العقرب", "الحوت"];
  
  // Signs of the same element are generally compatible
  if ((fireList.includes(sign1) && fireList.includes(sign2)) ||
      (earthList.includes(sign1) && earthList.includes(sign2)) ||
      (airList.includes(sign1) && airList.includes(sign2)) ||
      (waterList.includes(sign1) && waterList.includes(sign2))) {
    return true;
  }
  
  // Fire and Air are compatible, Earth and Water are compatible
  if ((fireList.includes(sign1) && airList.includes(sign2)) ||
      (airList.includes(sign1) && fireList.includes(sign2)) ||
      (earthList.includes(sign1) && waterList.includes(sign2)) ||
      (waterList.includes(sign1) && earthList.includes(sign2))) {
    return true;
  }
  
  return false;
};

const getVenusDescription = (sign: string): string => {
  const descriptions: Record<string, string> = {
    "الحمل": "العلاقات المفعمة بالنشاط والمغامرة",
    "الثور": "العلاقات المستقرة والحسية",
    "الجوزاء": "العلاقات المفعمة بالتواصل والتنوع",
    "السرطان": "العلاقات العاطفية والدافئة",
    "الأسد": "العلاقات المفعمة بالرومانسية والإبداع",
    "العذراء": "العلاقات العملية والخدومة",
    "الميزان": "العلاقات المتوازنة والجميلة",
    "العقرب": "العلاقات العميقة والشغوفة",
    "القوس": "العلاقات الحرة والمستكشفة",
    "الجدي": "العلاقات الملتزمة والتقليدية",
    "الدلو": "العلاقات الفريدة وغير التقليدية",
    "الحوت": "العلاقات الرومانسية والروحانية"
  };
  
  return descriptions[sign] || "علاقات تناسب طبيعتك الفريدة";
};

const getCareerPotential = (chart: any): string => {
  const saturn = chart.planets.find((p: any) => p.planet === "زحل");
  const jupiter = chart.planets.find((p: any) => p.planet === "المشتري");
  const mars = chart.planets.find((p: any) => p.planet === "المريخ");
  const midheaven = chart.midheaven;
  
  if (midheaven) {
    return `القمة السماوية (MC) في برج ${midheaven} تشير إلى أنك قد تجد النجاح في المهن المرتبطة بـ${getMidheavenCareer(midheaven)}.`;
  }
  
  if (saturn) {
    return `زحل في برج ${saturn.sign} يشير إلى أنك قد تواجه تحديات وتطور مهني في مجالات ${getSaturnCareer(saturn.sign)}. مع الصبر والمثابرة، يمكنك تحويل هذه التحديات إلى نقاط قوة.`;
  }
  
  if (mars) {
    return `المريخ في برج ${mars.sign} يشير إلى أنك تميل إلى المهن التي تتطلب ${getMarsCareer(mars.sign)}.`;
  }
  
  return "لديك مجموعة متنوعة من المهارات والاهتمامات التي يمكن أن تقودك إلى مسارات مهنية مختلفة. ابحث عن المهن التي تتوافق مع قيمك الشخصية وشغفك.";
};

const getMidheavenCareer = (sign: string): string => {
  const careers: Record<string, string> = {
    "الحمل": "القيادة والريادة والمنافسة",
    "الثور": "المال والأعمال والفنون",
    "الجوزاء": "التواصل والتعليم والإعلام",
    "السرطان": "الرعاية والتغذية والأسرة",
    "الأسد": "الترفيه والإبداع والقيادة",
    "العذراء": "الصحة والخدمة والتحليل",
    "الميزان": "القانون والفن والعلاقات",
    "العقرب": "التحقيق والتحول والموارد المشتركة",
    "القوس": "التعليم العالي والسفر والنشر",
    "الجدي": "الأعمال والإدارة والسلطة",
    "الدلو": "التكنولوجيا والابتكار والعمل الإنساني",
    "الحوت": "الفنون والروحانية والخدمة"
  };
  
  return careers[sign] || "مجالات تناسب مواهبك الفريدة";
};

const getSaturnCareer = (sign: string): string => {
  const careers: Record<string, string> = {
    "الحمل": "القيادة والأعمال الفردية",
    "الثور": "المالية والاستثمار",
    "الجوزاء": "الكتابة والتعليم",
    "السرطان": "الرعاية والعقارات",
    "الأسد": "الإدارة والترفيه",
    "العذراء": "الصحة والتحليل",
    "الميزان": "القانون والدبلوماسية",
    "العقرب": "البحث والتحقيق",
    "القوس": "التعليم العالي والدين",
    "الجدي": "الأعمال والإدارة",
    "الدلو": "العلوم والتكنولوجيا",
    "الحوت": "الفنون والصحة النفسية"
  };
  
  return careers[sign] || "مجالات تناسب قدراتك التنظيمية";
};

const getMarsCareer = (sign: string): string => {
  const traits: Record<string, string> = {
    "الحمل": "الحماس والمبادرة والقيادة",
    "الثور": "المثابرة والصبر والعمل اليدوي",
    "الجوزاء": "سرعة التفكير والمرونة والتواصل",
    "السرطان": "العناية والحماية والدعم",
    "الأسد": "الإبداع والقيادة والعروض",
    "العذراء": "الدقة والتحليل والخدمة",
    "الميزان": "التعاون والدبلوماسية والعدالة",
    "العقرب": "العزيمة والتحقيق والتحول",
    "القوس": "المغامرة والاستكشاف والتعلم",
    "الجدي": "التنظيم والمسؤولية والطموح",
    "الدلو": "الابتكار والأصالة والتفكير المستقبلي",
    "الحوت": "الإلهام والحدس والتضحية"
  };
  
  return traits[sign] || "مهارات تناسب طاقتك وحماسك";
};

const getLifePathPotential = (chart: any): string => {
  const sun = chart.planets.find((p: any) => p.planet === "الشمس");
  const jupiter = chart.planets.find((p: any) => p.planet === "المشتري");
  const northNode = chart.planets.find((p: any) => p.planet === "العقدة الشمالية");
  
  if (northNode) {
    return `العقدة الشمالية في برج ${northNode.sign} تشير إلى أن مسار نموك الروحي يتطلب منك تطوير خصائص ${northNode.sign} والتحرك بعيدًا عن المألوف والمريح.`;
  }
  
  if (jupiter) {
    return `المشتري في برج ${jupiter.sign} يشير إلى أن نموك وتوسعك يأتي من خلال ${getJupiterGrowth(jupiter.sign)}. هذا المجال قد يجلب لك الحظ والوفرة.`;
  }
  
  if (sun) {
    return `شمسك في برج ${sun.sign} تشير إلى أن مسار حياتك يركز على تطوير الثقة بالنفس من خلال ${getSunPath(sun.sign)}.`;
  }
  
  return "مسار حياتك فريد ومتعدد الأوجه. استمع إلى حدسك واتبع ما يشعرك بالرضا والمعنى.";
};

const getJupiterGrowth = (sign: string): string => {
  const growth: Record<string, string> = {
    "الحمل": "المبادرة والاستقلالية واتباع شغفك",
    "الثور": "بناء الاستقرار المادي وتقدير الجمال",
    "الجوزاء": "التعلم والتواصل وتبادل الأفكار",
    "السرطان": "تطوير الروابط العائلية والاتصال بجذورك",
    "الأسد": "التعبير الإبداعي والثقة بالنفس",
    "العذراء": "الخدمة والتحسين المستمر",
    "الميزان": "العلاقات المتوازنة والشراكات",
    "العقرب": "التحول الشخصي واستكشاف الجوانب الخفية",
    "القوس": "التوسع الفكري والروحي واستكشاف العالم",
    "الجدي": "تحقيق الأهداف العملية وبناء هيكل متين",
    "الدلو": "الابتكار والمشاركة في القضايا الاجتماعية",
    "الحوت": "الاتصال الروحي والتعبير الفني"
  };
  
  return growth[sign] || "مجالات تناسب تطورك الروحي والشخصي";
};

const getSunPath = (sign: string): string => {
  const paths: Record<string, string> = {
    "الحمل": "اكتشاف ذاتك وقدرتك على المبادرة",
    "الثور": "بناء الاستقرار وتقدير الجمال",
    "الجوزاء": "التعبير عن أفكارك والتواصل مع الآخرين",
    "السرطان": "الاتصال بمشاعرك العميقة وتوفير الرعاية",
    "الأسد": "التعبير الإبداعي والقيادة بقلب دافئ",
    "العذراء": "خدمة الآخرين وتحسين العالم من حولك",
    "الميزان": "خلق التوازن والجمال في حياتك وعلاقاتك",
    "العقرب": "التحول الشخصي واكتشاف الأسرار",
    "القوس": "توسيع آفاقك واستكشاف المعنى الأعمق",
    "الجدي": "بناء هيكل متين في حياتك وتحمل المسؤولية",
    "الدلو": "تطوير فرادتك والمساهمة في المجتمع",
    "الحوت": "الاتصال بالجانب الروحي والتعاطف مع الآخرين"
  };
  
  return paths[sign] || "مجالات تناسب جوهر شخصيتك";
};

const generateNotablePatterns = (chart: any): string => {
  let patterns = "";
  
  // Check for stellium (3+ planets in the same sign)
  const signCounts: Record<string, number> = {};
  chart.planets.forEach((planet: any) => {
    if (signCounts[planet.sign]) {
      signCounts[planet.sign]++;
    } else {
      signCounts[planet.sign] = 1;
    }
  });
  
  for (const sign in signCounts) {
    if (signCounts[sign] >= 3) {
      patterns += `• ستيليوم (تجمع كوكبي) في برج ${sign}: لديك ${signCounts[sign]} كواكب في برج ${sign}، مما يعزز صفات هذا البرج بشكل كبير في شخصيتك. تركز طاقتك وقدراتك في مجالات يمثلها هذا البرج.\n\n`;
      break;
    }
  }
  
  // Add more pattern checks here as needed
  
  if (patterns === "") {
    patterns = "• خريطتك الفلكية متوازنة نسبيًا، مما يشير إلى أنك شخص متعدد الجوانب قادر على التكيف مع مختلف المواقف والتحديات.\n\n";
  }
  
  return patterns;
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
