
import { toast } from "sonner";
import { User } from "@/types";

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
  "Pluto": "بلوتو"
};

// House names in Arabic
const houseNames = [
  "البيت الأول", "البيت الثاني", "البيت الثالث", "البيت الرابع",
  "البيت الخامس", "البيت السادس", "البيت السابع", "البيت الثامن",
  "البيت التاسع", "البيت العاشر", "البيت الحادي عشر", "البيت الثاني عشر"
];

// Convert Date to Julian Day
const dateToJulianDay = (date: string, time: string = "12:00", timezone: string = "UTC"): number => {
  const d = new Date(`${date}T${time}:00Z`);
  
  const jd = 2440587.5 + d.getTime() / 86400000;
  console.log(`Converting ${date} ${time} to Julian Day: ${jd}`);
  return jd;
};

// Get timezone offset in hours from latitude/longitude
const getTimezoneFromLatLng = async (lat: number, lng: number): Promise<string> => {
  // In a real implementation, this would use a timezone API
  return "UTC";
};

// Seed-based random generator for deterministic results
const random = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Process city name to get latitude and longitude
const getCityCoordinates = (cityName: string): { lat: number, lon: number } => {
  // Basic mapping of some major cities
  const cities: Record<string, { lat: number, lon: number }> = {
    "القاهرة": { lat: 30.0444, lon: 31.2357 },
    "الرياض": { lat: 24.7136, lon: 46.6753 },
    "دبي": { lat: 25.2048, lon: 55.2708 },
    "بيروت": { lat: 33.8886, lon: 35.4955 },
    "عمان": { lat: 31.9454, lon: 35.9284 },
    "بغداد": { lat: 33.3152, lon: 44.3661 },
    "الجزائر": { lat: 36.7372, lon: 3.0865 },
    "الدار البيضاء": { lat: 33.5731, lon: -7.5898 },
    "تونس": { lat: 36.8065, lon: 10.1815 },
    "دمشق": { lat: 33.5138, lon: 36.2765 }
  };
  
  // Try to extract the city from the string (assuming format like "القاهرة، مصر")
  const cityPart = cityName.split('،')[0].trim();
  
  if (cities[cityPart]) {
    return cities[cityPart];
  }
  
  // Default to Cairo if city not found
  console.log(`Could not find coordinates for ${cityName}, using default`);
  return { lat: 30.0444, lon: 31.2357 };
};

// Calculate natal chart based on birth details
export const calculateNatalChart = async (
  userId: string,
  birthDate: string, 
  birthTime: string = "", 
  birthPlace: string = ""
): Promise<any> => {
  try {
    const coords = getCityCoordinates(birthPlace);
    console.log(`Fetching chart data from API for: ${birthDate} ${birthTime} ${birthPlace}`);

    // Step 1: Call natal-chart API to get Julian Day
    const natalChartPayload = {
      date: birthDate,
      time: birthTime || "12:00",
      lat: coords.lat,
      lon: coords.lon,
      timezone: "UTC" // We could improve this by using the actual timezone
    };
    
    console.log("Sending payload to natal-chart API:", JSON.stringify(natalChartPayload));
    
    const natalChartResponse = await fetch("https://astrohabibiapi-564958434402.me-central1.run.app/natal-chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(natalChartPayload)
    });
    
    if (!natalChartResponse.ok) {
      throw new Error(`Natal chart API responded with ${natalChartResponse.status}`);
    }
    
    const natalChartData = await natalChartResponse.json();
    console.log("natal-chart API response:", JSON.stringify(natalChartData));
    
    const julianDay = natalChartData.julianDay;
    console.log("VERIFICATION - Using exact Julian Day from API:", julianDay);
    
    // Step 2: Call full-chart API with the Julian Day
    const fullChartPayload = {
      julianDay: julianDay,
      lat: coords.lat,
      lon: coords.lon
    };
    
    console.log("Sending payload to full-chart API:", JSON.stringify(fullChartPayload));
    
    const fullChartResponse = await fetch("https://astrohabibiapi-564958434402.me-central1.run.app/full-chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullChartPayload)
    });
    
    if (!fullChartResponse.ok) {
      throw new Error(`Full chart API responded with ${fullChartResponse.status}`);
    }
    
    const fullChartData = await fullChartResponse.json();
    console.log("full-chart API response:", JSON.stringify(fullChartData));
    
    // Process the full chart data
    return fullChartData;
    
  } catch (error) {
    console.error("Error fetching natal chart:", error);
    // Use fallback chart when API fails
    toast.error("Could not fetch your celestial data. Using generic chart data.");
    return generateFallbackChartData(birthDate, birthTime, birthPlace);
  }
};

// Generate a fallback chart when API fails
const generateFallbackChartData = (birthDate: string, birthTime: string, birthPlace: string): any => {
  console.warn("Generating fallback chart data as API request failed");
  
  const seedDate = new Date(birthDate).getTime();
  const seedTime = birthTime ? birthTime.split(":").reduce((acc, val) => acc + parseInt(val, 10), 0) : 0;
  const seedPlace = birthPlace.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const combinedSeed = seedDate + seedTime + seedPlace;
  
  // Generate a fallback structure that matches the API response
  return {
    julianDay: dateToJulianDay(birthDate, birthTime),
    timestamp: new Date().toISOString(),
    ascendant: {
      sign: getZodiacSign(birthDate),
      degree: random(combinedSeed + 18) * 30
    },
    midheaven: {
      sign: zodiacSigns[Math.floor(random(combinedSeed + 19) * 12)],
      degree: random(combinedSeed + 19) * 30
    },
    planets: {
      Sun: { sign: getZodiacSign(birthDate), degree: random(combinedSeed) * 30, retrograde: false },
      Moon: { sign: zodiacSigns[Math.floor(random(combinedSeed + 1) * 12)], degree: random(combinedSeed + 1) * 30, retrograde: false },
      Mercury: { sign: zodiacSigns[Math.floor(random(combinedSeed + 2) * 12)], degree: random(combinedSeed + 2) * 30, retrograde: random(combinedSeed + 3) > 0.8 },
      Venus: { sign: zodiacSigns[Math.floor(random(combinedSeed + 4) * 12)], degree: random(combinedSeed + 4) * 30, retrograde: random(combinedSeed + 5) > 0.9 },
      Mars: { sign: zodiacSigns[Math.floor(random(combinedSeed + 6) * 12)], degree: random(combinedSeed + 6) * 30, retrograde: random(combinedSeed + 7) > 0.85 },
      Jupiter: { sign: zodiacSigns[Math.floor(random(combinedSeed + 8) * 12)], degree: random(combinedSeed + 8) * 30, retrograde: random(combinedSeed + 9) > 0.7 },
      Saturn: { sign: zodiacSigns[Math.floor(random(combinedSeed + 10) * 12)], degree: random(combinedSeed + 10) * 30, retrograde: random(combinedSeed + 11) > 0.6 },
      Uranus: { sign: zodiacSigns[Math.floor(random(combinedSeed + 12) * 12)], degree: random(combinedSeed + 12) * 30, retrograde: random(combinedSeed + 13) > 0.3 },
      Neptune: { sign: zodiacSigns[Math.floor(random(combinedSeed + 14) * 12)], degree: random(combinedSeed + 14) * 30, retrograde: random(combinedSeed + 15) > 0.4 },
      Pluto: { sign: zodiacSigns[Math.floor(random(combinedSeed + 16) * 12)], degree: random(combinedSeed + 16) * 30, retrograde: random(combinedSeed + 17) > 0.5 }
    },
    houses: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      sign: zodiacSigns[Math.floor(random(combinedSeed + 20 + i) * 12)],
      degree: random(combinedSeed + 20 + i) * 30
    }))
  };
};

// Get zodiac sign from birth date
export const getZodiacSign = (birthDate: string): string => {
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  
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
  return "الحوت";
};

// Get emoji for zodiac sign
export const getZodiacEmoji = (zodiacSign: string): string => {
  const zodiacEmojis: Record<string, string> = {
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
  
  return zodiacEmojis[zodiacSign] || "✨";
};

// Convert English zodiac sign to Arabic
const getArabicZodiacSign = (englishSign: string): string => {
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
  
  return signMap[englishSign] || englishSign;
};

// Generate horoscope based on ephemeris data
export const generateHoroscopeFromEphemeris = async (
  userId: string,
  chart: any,
  type: string,
  dialect: string
): Promise<any> => {
  // This would normally call an LLM or other service to generate personalized content
  // For now, we'll return a simple horoscope based on the chart data
  
  try {
    // Get planet positions from the chart, making sure we're extracting them correctly
    const sunData = chart.planets.Sun || {};
    const moonData = chart.planets.Moon || {};
    
    // Create basic content based on type and chart data
    let content = "";
    let title = "";
    
    // Ensure we have the correct Arabic zodiac sign names
    const sunSign = getArabicZodiacSign(sunData.sign);
    const moonSign = getArabicZodiacSign(moonData.sign);
    
    switch (type) {
      case "daily":
        title = "توقعات اليومية";
        content = `كشخص من برج ${sunSign}، اليوم هو يوم مناسب للتفكير في أهدافك المستقبلية. قمرك في ${moonSign} يعزز الإبداع والتواصل.`;
        break;
      case "love":
        title = "توقعات الحب والعلاقات";
        content = `علاقاتك العاطفية متأثرة بوجود الشمس في ${sunSign} والقمر في ${moonSign}. هذا وقت جيد للتعبير عن مشاعرك بصدق.`;
        break;
      case "career":
        title = "توقعات العمل والمهنة";
        content = `وضع الشمس في ${sunSign} يدل على فرص مهنية جديدة. استفد من طاقة القمر في ${moonSign} لتطوير مهاراتك القيادية.`;
        break;
      case "health":
        title = "توقعات الصحة والعافية";
        content = `صحتك متأثرة بتوازن الطاقة بين الشمس في ${sunSign} والقمر في ${moonSign}. حاول الاهتمام بالتوازن بين النشاط والراحة.`;
        break;
      default:
        title = "التوقعات الفلكية";
        content = `وفقا لخريطتك الفلكية مع الشمس في ${sunSign} والقمر في ${moonSign} والطالع ${getArabicZodiacSign(chart.ascendant.sign)}، يمكنك توقع فترة من النمو الشخصي.`;
    }
    
    // Add dialect-specific phrases (could be expanded)
    if (dialect === "egyptian") {
      content += " وزي ما بنقول في مصر، اللي يتعب دلوقتي هيرتاح بعدين!";
    } else if (dialect === "levantine") {
      content += " متل ما منحكي عنا، شد حيلك وما تيأس!";
    }
    
    // Generate lucky elements based on chart
    const luckyNumber = Math.floor(sunData.degree || 0) % 10 + 1;
    const luckyStar = Object.keys(planetNames)[Math.floor(Object.keys(planetNames).length * 0.3)];
    const luckyColors = ["الأزرق", "الأخضر", "الذهبي", "الأبيض", "الأحمر"];
    const luckyColor = luckyColors[Math.floor(Object.keys(chart.planets).length * 0.7) % luckyColors.length];
    
    return {
      title,
      content,
      luckyNumber,
      luckyStar: planetNames[luckyStar as keyof typeof planetNames] || "المشتري",
      luckyColor
    };
  } catch (error) {
    console.error("Error generating horoscope from ephemeris:", error);
    return {
      title: "التوقعات الفلكية",
      content: "نعتذر، لم نتمكن من توليد تنبؤ دقيق في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقًا.",
      luckyNumber: 7,
      luckyStar: "المشتري",
      luckyColor: "الأزرق"
    };
  }
};

// Generate a comprehensive birth chart interpretation
export const generateBirthChartInterpretation = (chart: any, hasBirthTime: boolean): string => {
  try {
    console.log("Generating interpretation from raw API data:", JSON.stringify(chart));
    
    // Directly work with the original API response format
    // Translate the zodiac signs from English to Arabic
    const sunSign = getArabicZodiacSign(chart.planets.Sun.sign);
    const moonSign = getArabicZodiacSign(chart.planets.Moon.sign);
    const mercurySign = getArabicZodiacSign(chart.planets.Mercury.sign);
    const venusSign = getArabicZodiacSign(chart.planets.Venus.sign);
    const marsSign = getArabicZodiacSign(chart.planets.Mars.sign);
    const jupiterSign = getArabicZodiacSign(chart.planets.Jupiter.sign);
    const saturnSign = getArabicZodiacSign(chart.planets.Saturn.sign);
    const uranusSign = getArabicZodiacSign(chart.planets.Uranus.sign);
    const neptuneSign = getArabicZodiacSign(chart.planets.Neptune.sign);
    const plutoSign = getArabicZodiacSign(chart.planets.Pluto.sign);
    
    // Get ascendant and midheaven from the direct API response
    const ascendantSign = getArabicZodiacSign(chart.ascendant.sign);
    const midheavenSign = getArabicZodiacSign(chart.midheaven.sign);
    
    // Build a comprehensive interpretation
    let interpretation = `✨ تحليل خريطتك الفلكية الكاملة ✨\n\n`;
    
    // Section 1: Overview
    interpretation += `🪐 نظرة عامة:\n`;
    interpretation += `شمسك في برج ${sunSign} ${getZodiacEmoji(sunSign)}\n`;
    interpretation += `قمرك في برج ${moonSign} ${getZodiacEmoji(moonSign)}\n`;
    
    if (hasBirthTime) {
      interpretation += `الطالع (الأسندنت) في برج ${ascendantSign} ${getZodiacEmoji(ascendantSign)}\n\n`;
    } else {
      interpretation += `\nنظراً لعدم توفر وقت الميلاد الدقيق، لا يمكننا تحديد الطالع والبيوت الفلكية. الرجاء إضافة وقت الميلاد للحصول على تحليل كامل.\n\n`;
    }
    
    // Section 2: Detailed planet analysis
    interpretation += `💫 تحليل الكواكب:\n\n`;
    
    interpretation += `• الشمس في ${sunSign} ${getZodiacEmoji(sunSign)}:\n`;
    interpretation += getPlanetInterpretation("sun", sunSign) + "\n\n";
    
    interpretation += `• القمر في ${moonSign} ${getZodiacEmoji(moonSign)}:\n`;
    interpretation += getPlanetInterpretation("moon", moonSign) + "\n\n";
    
    interpretation += `• عطارد في ${mercurySign} ${getZodiacEmoji(mercurySign)}${chart.planets.Mercury.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += getPlanetInterpretation("mercury", mercurySign) + "\n\n";
    
    interpretation += `• الزهرة في ${venusSign} ${getZodiacEmoji(venusSign)}${chart.planets.Venus.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += getPlanetInterpretation("venus", venusSign) + "\n\n";
    
    interpretation += `• المريخ في ${marsSign} ${getZodiacEmoji(marsSign)}${chart.planets.Mars.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += getPlanetInterpretation("mars", marsSign) + "\n\n";
    
    interpretation += `• المشتري في ${jupiterSign} ${getZodiacEmoji(jupiterSign)}${chart.planets.Jupiter.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += getPlanetInterpretation("jupiter", jupiterSign) + "\n\n";
    
    interpretation += `• زحل في ${saturnSign} ${getZodiacEmoji(saturnSign)}${chart.planets.Saturn.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += getPlanetInterpretation("saturn", saturnSign) + "\n\n";
    
    interpretation += `• أورانوس في ${uranusSign} ${getZodiacEmoji(uranusSign)}${chart.planets.Uranus.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += "أورانوس يمثل التغيير المفاجئ والتحرر والابتكار في حياتك. موقعه يؤثر على كيفية تعاملك مع التكنولوجيا والمجتمع.\n\n";
    
    interpretation += `• نبتون في ${neptuneSign} ${getZodiacEmoji(neptuneSign)}${chart.planets.Neptune.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += "نبتون يتعلق بالخيال والروحانية والتضحية. يؤثر على جوانب الإلهام والحدس في شخصيتك.\n\n";
    
    interpretation += `• بلوتو في ${plutoSign} ${getZodiacEmoji(plutoSign)}${chart.planets.Pluto.retrograde ? " (تراجع)" : ""}:\n`;
    interpretation += "بلوتو يمثل التحول العميق والقوة والتجديد. يشير إلى المجالات التي تمر فيها بتغيرات جذرية.\n";
    
    // Section 3: Houses (only if birth time is available)
    if (hasBirthTime && chart.houses && chart.houses.length > 0) {
      interpretation += `\n\n🏠 تحليل البيوت الفلكية:\n\n`;
      
      chart.houses.forEach((house: any) => {
        const houseNumber = house.house;
        const houseSign = getArabicZodiacSign(house.sign);
        
        interpretation += `• ${houseNames[houseNumber - 1]} في ${houseSign} ${getZodiacEmoji(houseSign)}:\n`;
        interpretation += getHouseInterpretation(houseNumber, houseSign) + "\n\n";
      });
    }
    
    // Section 4: Ascendant & Midheaven (only if birth time is available)
    if (hasBirthTime) {
      interpretation += `\n🔭 الطالع والميدهيفن:\n\n`;
      interpretation += `• الطالع في ${ascendantSign} ${getZodiacEmoji(ascendantSign)}:\n`;
      interpretation += getAscendantInterpretation(ascendantSign) + "\n\n";
      
      interpretation += `• الميدهيفن في ${midheavenSign} ${getZodiacEmoji(midheavenSign)}:\n`;
      interpretation += getMidheavenInterpretation(midheavenSign) + "\n";
    }
    
    // Section 5: Psychological profile
    interpretation += `\n\n🧠 الملف النفسي:\n`;
    interpretation += `تجمع بين طاقة الشمس في ${sunSign} وعاطفة القمر في ${moonSign}،`;
    if (hasBirthTime) {
      interpretation += ` مع تأثير الطالع في ${ascendantSign}.`;
    }
    interpretation += ` هذه التركيبة تجعلك ${getPsychologicalProfile(sunSign, moonSign, hasBirthTime ? ascendantSign : null)}\n`;
    
    // Section 6: Life potentials
    interpretation += `\n❤️ إمكانات الحياة:\n\n`;
    interpretation += `• الحب والعلاقات: ${getLoveProfile(venusSign, marsSign, moonSign)}\n\n`;
    interpretation += `• المهنة والعمل: ${getCareerProfile(sunSign, jupiterSign, saturnSign, hasBirthTime ? midheavenSign : null)}\n\n`;
    interpretation += `• المسار الحياتي: ${getLifePathProfile(sunSign, moonSign, jupiterSign)}\n`;
    
    // Section 7: Notable patterns
    const patterns = getNotablePlanetary(chart);
    if (patterns && patterns.length > 0) {
      interpretation += `\n\n🌟 أنماط كوكبية ملحوظة:\n`;
      patterns.forEach((pattern: string) => {
        interpretation += `• ${pattern}\n`;
      });
    }
    
    return interpretation;
  } catch (error) {
    console.error("Error generating birth chart interpretation:", error);
    return "عذراً، حدث خطأ أثناء توليد تحليل خريطتك الفلكية. يرجى المحاولة مرة أخرى لاحقًا.";
  }
};

// Get planet interpretation based on sign
const getPlanetInterpretation = (planet: string, sign: string): string => {
  const interpretations: Record<string, Record<string, string>> = {
    "sun": {
      "الحمل": "تمتلك شخصية قوية وحماسية ومبادرة. تحب المغامرة وتسعى لتكون في المقدمة دائماً.",
      "الثور": "تتميز بالصبر والثبات والقدرة على بناء الأشياء على أسس متينة. تقدر الجمال والرفاهية.",
      "الجوزاء": "فضولي وذكي ومتعدد المواهب. تحب التواصل وتبادل الأفكار وتتكيف بسرعة مع المواقف المختلفة.",
      "السرطان": "عاطفي وحدسي وراعٍ للآخرين. تهتم بالعائلة والأمان العاطفي وتحمي من تحب بقوة.",
      "الأسد": "إبداعي وكريم ومحب للحياة. تسعى للتقدير والاعتراف وتحب أن تكون محط الأنظار.",
      "العذراء": "دقيق وعملي ومحلل. تهتم بالتفاصيل وتسعى للكمال في كل ما تقوم به.",
      "الميزان": "دبلوماسي وعادل ومحب للتوازن والانسجام. تكره الصراع وتسعى دائماً للتوفيق.",
      "العقرب": "عميق وغامض وقوي الإرادة. لديك قدرة هائلة على التحول والتجديد في حياتك.",
      "القوس": "متفائل ومغامر ومحب للحرية. تسعى للتوسع في المعرفة والخبرات الجديدة.",
      "الجدي": "طموح ومنضبط وعملي. تسعى للنجاح والإنجاز وتعمل بجد للوصول إلى أهدافك.",
      "الدلو": "مستقل وإنساني ومبتكر. تفكر بطريقة مختلفة وتقدر الحرية الفكرية.",
      "الحوت": "حساس وروحاني وخيالي. لديك قدرة على التعاطف مع الآخرين وفهم مشاعرهم."
    },
    "moon": {
      // Similar interpretations for other planets and signs
      "الحمل": "مشاعرك مباشرة وقوية، تتفاعل بسرعة مع المواقف العاطفية. تحتاج إلى مساحة للتعبير عن مشاعرك بحرية.",
      "الثور": "تسعى للاستقرار العاطفي والأمان، وتعبر عن مشاعرك بطريقة هادئة ومتأنية. تجد الراحة في الأمور المادية والملموسة.",
      "الجوزاء": "مشاعرك متغيرة وتتأثر بالتواصل الفكري. تحتاج للتعبير عن أفكارك ومشاعرك بالكلام للشعور بالتوازن.",
      "السرطان": "عواطفك عميقة وحدسية، ترتبط بشدة بالماضي والذكريات. تهتم بالعائلة والجذور وتحتاج للشعور بالانتماء.",
      "الأسد": "تعبر عن مشاعرك بقوة ووضوح، وتحتاج للتقدير والإعجاب. عواطفك دافئة وكريمة ولكنك تحتاج للاعتراف بها.",
      "العذراء": "تتعامل مع مشاعرك بتحليل وعقلانية، وتحتاج للنظام والترتيب للشعور بالأمان العاطفي.",
      "الميزان": "تسعى للتوازن والانسجام في عالمك العاطفي. تحتاج للعلاقات المتناغمة وتكره النزاعات والصراعات.",
      "العقرب": "عواطفك عميقة ومكثفة وتخفي الكثير تحت السطح. لديك قدرة على التغلغل في مشاعر الآخرين وفهمها.",
      "القوس": "تتعامل مع مشاعرك بتفاؤل وانفتاح، وتحتاج للحرية العاطفية والاستكشاف للشعور بالرضا.",
      "الجدي": "تتحكم في مشاعرك وتتعامل معها بمسؤولية. قد تكبت عواطفك أحياناً لكنك تتعلم من تجاربك العاطفية.",
      "الدلو": "تعبر عن مشاعرك بطريقة غير تقليدية وتقيّم الأمور بموضوعية. تحتاج لمساحة شخصية في علاقاتك.",
      "الحوت": "عواطفك غنية وخيالية، وتتأثر بشدة بمشاعر الآخرين. لديك حدس قوي وقدرة على التعاطف العميق."
    },
    "mercury": {
      // Interpretations for Mercury
      "الحمل": "تفكر بسرعة وتعبر عن أفكارك بجرأة ومباشرة. قد تكون متسرعاً أحياناً في قراراتك.",
      "الثور": "تفكر بتأنٍ وعملية، وتحتاج لوقت لمعالجة المعلومات الجديدة. أفكارك ثابتة وموثوقة.",
      "الجوزاء": "عقلك سريع ومتنوع، وتستمتع بتبادل الأفكار والمعلومات. لديك فضول فكري لا ينضب.",
      "السرطان": "تفكر بطريقة حدسية وعاطفية، وتتأثر أفكارك بمشاعرك وذكرياتك.",
      "الأسد": "لديك طريقة تفكير إبداعية ودرامية، وتعبر عن أفكارك بثقة وحماس.",
      "العذراء": "تحلل المعلومات بدقة وتهتم بالتفاصيل. لديك عقل نقدي ومنظم.",
      "الميزان": "تفكر بتوازن وتأخذ وجهات نظر مختلفة بعين الاعتبار. تميل للدبلوماسية في تواصلك.",
      "العقرب": "تفكر بعمق وتبحث عما هو مخفي. لديك قدرة على كشف الحقائق والأسرار.",
      "القوس": "تفكر بطريقة فلسفية وتهتم بالصورة الكبيرة. تحب استكشاف أفكار جديدة.",
      "الجدي": "تفكر بطريقة منظمة وعملية، وتقيم الأفكار بناءً على فائدتها الواقعية.",
      "الدلو": "لديك طريقة تفكير مبتكرة وغير تقليدية. تستمتع بالأفكار الثورية والمستقبلية.",
      "الحوت": "تفكر بطريقة خيالية وحدسية. قد تجد صعوبة في التعبير عن أفكارك بوضوح دائماً."
    },
    "venus": {
      // More interpretations
      "الحمل": "تحب بحماس وعفوية، وتنجذب للتحديات في العلاقات. تقدر الاستقلالية والمغامرة في الحب.",
      "الثور": "تقدر الجمال والرفاهية والاستقرار في العلاقات. تعبر عن حبك بطرق ملموسة وعملية.",
      "الجوزاء": "تحتاج للتواصل الفكري في علاقاتك، وتقدر الخفة والمرح والتنوع في الحب.",
      "السرطان": "تحب بعمق وإخلاص، وتقدر الأمان العاطفي والعلاقات الحميمية والدافئة.",
      "الأسد": "رومانسي ودرامي في التعبير عن مشاعرك، وتقدر الإعجاب والإطراء في العلاقات.",
      "العذراء": "دقيق في اختيار شريكك، وتهتم بالتفاصيل الصغيرة في العلاقة. تعبر عن حبك بالخدمة والاهتمام.",
      "الميزان": "تقدر التوازن والجمال والتناغم في العلاقات. الشراكة والعدالة مهمة بالنسبة لك.",
      "العقرب": "تحب بشكل عميق وشغوف، وتبحث عن العلاقات التي تلمس روحك وتغيرك.",
      "القوس": "تقدر الحرية والمغامرة في العلاقات، وتنجذب لشريك يوسع آفاقك ويلهمك.",
      "الجدي": "تأخذ الحب بجدية ومسؤولية، وتبحث عن علاقات طويلة الأمد ذات أساس متين.",
      "الدلو": "تقدر الصداقة والاستقلالية في العلاقات، وتنجذب للشخصيات الفريدة والمختلفة.",
      "الحوت": "رومانسي وحالم في الحب، وتسعى لعلاقة روحية تتجاوز الحدود المادية."
    },
    "mars": {
      // And so on for other planets
      "الحمل": "تتصرف بحماس وعفوية، وتبادر بشجاعة لتحقيق ما تريد. قد تكون متهوراً أحياناً.",
      "الثور": "تعمل بثبات واستمرارية، ولديك إصرار كبير على تحقيق أهدافك المادية.",
      "الجوزاء": "تصرفاتك سريعة ومتنوعة، وتستخدم ذكاءك وقدرتك على التواصل لتحقيق ما تريد.",
      "السرطان": "تتصرف بناءً على مشاعرك وحدسك، وتدافع بقوة عن من تحب وما تؤمن به.",
      "الأسد": "تتصرف بثقة وإبداع، وتضع قلبك في كل ما تفعله. تسعى للاعتراف بإنجازاتك.",
      "العذراء": "تعمل بدقة وكفاءة، وتهتم بالتفاصيل. قد تكون ناقداً لنفسك وللآخرين.",
      "الميزان": "تسعى للعدالة والتوازن في تصرفاتك، وقد تتردد قبل اتخاذ القرارات الحاسمة.",
      "العقرب": "تتصرف بعمق وتصميم، ولديك قدرة هائلة على التركيز وتحقيق أهدافك.",
      "القوس": "تتصرف بتفاؤل ومغامرة، وتبحث عن توسيع آفاقك وخبراتك باستمرار.",
      "الجدي": "تعمل بجد ومثابرة، وتضع خططاً طويلة المدى وتلتزم بها.",
      "الدلو": "تتصرف بطرق غير تقليدية، وتدافع عن آرائك المستقلة وأفكارك المبتكرة.",
      "الحوت": "تتصرف بناءً على حدسك وإلهامك، وقد تكون متردداً أحياناً في المواقف التي تتطلب حسماً."
    },
    "jupiter": {
      "الحمل": "تنمو وتتوسع من خلال المبادرات الشخصية والقيادة والمغامرات الجديدة.",
      "الثور": "تزدهر من خلال بناء الثروة المادية والاستقرار وتقدير الجمال في الحياة.",
      "الجوزاء": "تتوسع آفاقك من خلال التعلم والتواصل وتنويع معارفك وخبراتك.",
      "السرطان": "تنمو من خلال تعميق روابطك العائلية والعاطفية وبناء قاعدة آمنة.",
      "الأسد": "تزدهر من خلال الإبداع والتعبير عن نفسك والاحتفال بالحياة.",
      "العذراء": "تتوسع من خلال تحسين مهاراتك العملية وخدمة الآخرين والاهتمام بالتفاصيل.",
      "الميزان": "تنمو من خلال الشراكات المثمرة والتعاون وتحقيق التوازن في حياتك.",
      "العقرب": "تزدهر من خلال التحولات العميقة والمواجهات المكثفة والاكتشافات الداخلية.",
      "القوس": "تتوسع آفاقك من خلال السفر والتعلم العالي واستكشاف فلسفات جديدة.",
      "الجدي": "تنمو من خلال بناء هياكل متينة في حياتك وتحمل المسؤولية والمثابرة.",
      "الدلو": "تزدهر من خلال الابتكار والإصلاح الاجتماعي والصداقات المتنوعة.",
      "الحوت": "تتوسع روحياً من خلال التعاطف والإيمان والتواصل مع العالم غير المرئي."
    },
    "saturn": {
      "الحمل": "تواجه تحديات في بناء هويتك المستقلة وتطوير الصبر والتأني في مبادراتك.",
      "الثور": "تتعلم دروساً في الأمن المادي والقيم الشخصية وتطوير الاكتفاء الداخلي.",
      "الجوزاء": "تواجه تحديات في التواصل والتعلم، وتحتاج لتطوير التفكير المنظم والتركيز.",
      "السرطان": "تتعلم دروساً في الحدود العاطفية والتوازن بين العمل والحياة الأسرية.",
      "الأسد": "تواجه تحديات في التعبير الإبداعي وتطوير الثقة الحقيقية بدلاً من الغرور.",
      "العذراء": "تتعلم دروساً في تحسين روتينك اليومي وتطوير مهاراتك العملية بتأنٍ.",
      "الميزان": "تواجه تحديات في العلاقات والشراكات، وتتعلم بناء توازن بين الاستقلالية والاعتماد المتبادل.",
      "العقرب": "تتعلم دروساً في مواجهة المخاوف العميقة والتعامل مع قضايا القوة والتحكم.",
      "القوس": "تواجه تحديات في توسيع آفاقك بحكمة وبناء فلسفة حياة واقعية.",
      "الجدي": "تتعلم دروساً في المسؤولية والطموح، وتطوير بنية داخلية قوية.",
      "الدلو": "تواجه تحديات في التوازن بين الفردية والانتماء للمجموعة، وتطبيق أفكارك بواقعية.",
      "الحوت": "تتعلم دروساً في وضع حدود للتعاطف وتحويل الأحلام إلى واقع ملموس."
    }
  };
  
  return interpretations[planet]?.[sign] || "يؤثر هذا الموقع على جانب مهم من جوانب شخصيتك وحياتك.";
};

// House interpretations
const getHouseInterpretation = (house: number, sign: string): string => {
  const houseInterpretations: Record<number, string> = {
    1: "يؤثر على مظهرك الشخصي وكيف يراك الآخرون، وكذلك طريقة تعاملك مع العالم.",
    2: "يتعلق بمواردك المادية، قيمك، وما تعتبره ثميناً في الحياة.",
    3: "يرتبط بالتواصل، التعلم، والعلاقات مع الإخوة والجيران.",
    4: "يتعلق بمنزلك، عائلتك، جذورك، والأمان العاطفي.",
    5: "يرتبط بالإبداع، المتعة، الأطفال، والتعبير عن الذات.",
    6: "يتعلق بالعمل اليومي، الصحة، والخدمة للآخرين.",
    7: "يرتبط بالشراكات الشخصية والتجارية، والعلاقات الوثيقة.",
    8: "يتعلق بالتحولات، الموارد المشتركة، والعمق النفسي.",
    9: "يرتبط بالسفر، التعليم العالي، والفلسفة الشخصية.",
    10: "يتعلق بالمهنة، المكانة الاجتماعية، والإنجازات العامة.",
    11: "يرتبط بالصداقات، المجموعات، والأهداف المستقبلية.",
    12: "يتعلق بالعالم الباطني، التضحية، والخدمة اللامشروطة."
  };
  
  return `${houseInterpretations[house] || ""} وجود برج ${sign} ${getZodiacEmoji(sign)} هنا يضيف طاقة خاصة لهذا المجال من حياتك.`;
};

// Ascendant and Midheaven interpretations
const getAscendantInterpretation = (sign: string): string => {
  const interpretations: Record<string, string> = {
    "الحمل": "تظهر للعالم كشخص مبادر وجريء ومستقل. يرى الناس أنك مفعم بالطاقة والحماس.",
    "الثور": "تبدو للآخرين مستقراً وموثوقاً وعملياً. يرى الناس فيك الثبات والقوة الهادئة.",
    "الجوزاء": "تظهر للعالم كشخص فضولي ومتكيف واجتماعي. يراك الناس ذكياً وخفيف الظل.",
    "السرطان": "تبدو للآخرين حساساً وراعياً وعاطفياً. يرى الناس فيك الشخص الذي يمكن الاعتماد عليه عاطفياً.",
    "الأسد": "تظهر للعالم كشخص واثق وكريم وإبداعي. يراك الناس قائداً طبيعياً يجذب الانتباه.",
    "العذراء": "تبدو للآخرين منظماً ودقيقاً ومفيداً. يرى الناس فيك الشخص العملي والتحليلي.",
    "الميزان": "تظهر للعالم كشخص دبلوماسي ولطيف ومنصف. يراك الناس شخصاً اجتماعياً يسعى للتوازن.",
    "العقرب": "تبدو للآخرين غامضاً وعميقاً ومكثفاً. يرى الناس فيك قوة وتصميماً لا يُقهران.",
    "القوس": "تظهر للعالم كشخص متفائل ومغامر وصريح. يراك الناس منفتحاً على آفاق جديدة.",
    "الجدي": "تبدو للآخرين جدياً ومسؤولاً وطموحاً. يرى الناس فيك الشخص الجدير بالاحترام.",
    "الدلو": "تظهر للعالم كشخص مستقل وفريد ومبتكر. يراك الناس متقدماً على عصرك.",
    "الحوت": "تبدو للآخرين حساساً وحالماً ومتعاطفاً. يرى الناس فيك الشخص الروحاني واللطيف."
  };
  
  return interpretations[sign] || "الطالع يمثل القناع الذي ترتديه للعالم، وكيف يراك الآخرون للوهلة الأولى.";
};

const getMidheavenInterpretation = (sign: string): string => {
  const interpretations: Record<string, string> = {
    "الحمل": "تميل لمسار مهني يتيح لك المبادرة والقيادة. قد تنجذب للمهن التي تتطلب الشجاعة والعمل المستقل.",
    "الثور": "تسعى للاستقرار المهني والأمن المادي. قد تنجح في المجالات المالية أو التي تتعامل مع الموارد الملموسة.",
    "الجوزاء": "تميل للمهن التي تتطلب التواصل والمرونة الفكرية. قد تنجذب للكتابة، التدريس، أو الإعلام.",
    "السرطان": "تسعى لمسار مهني يشبع احتياجاتك العاطفية. قد تنجح في المهن المتعلقة بالرعاية والخدمات الإنسانية.",
    "الأسد": "تميل للمهن التي تضعك في دائرة الضوء. قد تنجذب للفنون، الترفيه، أو المناصب القيادية.",
    "العذراء": "تسعى لإتقان مهارات محددة في مسارك المهني. قد تنجح في المجالات التي تتطلب التحليل والدقة.",
    "الميزان": "تميل للمهن التي تتعامل مع العدالة والجمال. قد تنجذب للقانون، التصميم، أو الدبلوماسية.",
    "العقرب": "تسعى لمسار مهني يتيح لك التأثير العميق والتحول. قد تنجح في مجالات البحث، علم النفس، أو إدارة الموارد.",
    "القوس": "تميل للمهن التي توسع آفاقك الفكرية والجغرافية. قد تنجذب للتعليم العالي، النشر، أو العمل الدولي.",
    "الجدي": "تسعى لبناء سمعة مهنية قوية ومكانة اجتماعية مرموقة. قد تنجح في الإدارة، الأعمال، أو المؤسسات الرسمية.",
    "الدلو": "تميل للمهن المبتكرة والتي تخدم المجتمع. قد تنجذب للتكنولوجيا، العمل الإنساني، أو المجالات المستقبلية.",
    "الحوت": "تسعى لمسار مهني يتوافق مع قيمك الروحية. قد تنجح في الفنون، الرعاية الصحية، أو المجالات الروحانية."
  };
  
  return interpretations[sign] || "الميدهيفن يمثل مسارك المهني وصورتك العامة في المجتمع، وكيف يمكن أن تحقق النجاح.";
};

// Psychological profile based on sun, moon and ascendant
const getPsychologicalProfile = (sun: string, moon: string, ascendant: string | null): string => {
  // This would be much more complex in reality, but for simplicity:
  let traits = "";
  
  switch (sun) {
    case "الحمل":
    case "الأسد":
    case "القوس":
      traits += "شخصية نارية، مفعمة بالحماس والطاقة الإبداعية";
      break;
    case "الثور":
    case "العذراء":
    case "الجدي":
      traits += "شخصية ترابية، عملية وموثوقة";
      break;
    case "الجوزاء":
    case "الميزان":
    case "الدلو":
      traits += "شخصية هوائية، تميل للتفكير والتواصل";
      break;
    case "السرطان":
    case "العقرب":
    case "الحوت":
      traits += "شخصية مائية، عاطفية وحدسية";
      break;
  }
  
  traits += ". ";
  
  // Add moon influence
  if (moon === "الحمل" || moon === "الأسد" || moon === "القوس") {
    traits += "عواطفك قوية ومباشرة";
  } else if (moon === "الثور" || moon === "العذراء" || moon === "الجدي") {
    traits += "مشاعرك مستقرة وعملية";
  } else if (moon === "الجوزاء" || moon === "الميزان" || moon === "الدلو") {
    traits += "تتعامل مع مشاعرك بعقلانية";
  } else {
    traits += "عواطفك عميقة وحدسية";
  }
  
  traits += ". ";
  
  // Add ascendant if available
  if (ascendant) {
    traits += `يراك الآخرون شخصاً ${ascendant === "الحمل" || ascendant === "الأسد" || ascendant === "القوس" ? "واثقاً ومؤثراً" : 
              ascendant === "الثور" || ascendant === "العذراء" || ascendant === "الجدي" ? "موثوقاً ومتأنياً" :
              ascendant === "الجوزاء" || ascendant === "الميزان" || ascendant === "الدلو" ? "اجتماعياً ومتكيفاً" :
              "حساساً ومتعاطفاً"}.`;
  }
  
  return traits;
};

// Love profile based on venus and mars
const getLoveProfile = (venus: string, mars: string, moon: string): string => {
  let traits = "";
  
  // Venus influence
  if (venus === "الحمل" || venus === "الأسد" || venus === "القوس") {
    traits += "تنجذب للعلاقات المليئة بالحماس والمغامرة";
  } else if (venus === "الثور" || venus === "العذراء" || venus === "الجدي") {
    traits += "تقدّر الاستقرار والأمان في العلاقات";
  } else if (venus === "الجوزاء" || venus === "الميزان" || venus === "الدلو") {
    traits += "تبحث عن شريك يشاركك الأفكار والتواصل الفكري";
  } else {
    traits += "تسعى لعلاقة عميقة وروحية";
  }
  
  traits += ". ";
  
  // Mars influence
  if (mars === "الحمل" || mars === "الأسد" || mars === "القوس") {
    traits += "تعبر عن رغباتك بصراحة وحماس";
  } else if (mars === "الثور" || mars === "العذراء" || mars === "الجدي") {
    traits += "تتصرف بثبات ووفاء في علاقاتك";
  } else if (mars === "الجوزاء" || mars === "الميزان" || mars === "الدلو") {
    traits += "تفضل التنوع والتجديد في العلاقة";
  } else {
    traits += "تقترب من الشريك بحساسية وتعاطف";
  }
  
  return traits;
};

// Career profile
const getCareerProfile = (sun: string, jupiter: string, saturn: string, midheaven: string | null): string => {
  let traits = "";
  
  // Sun influence
  if (sun === "الحمل" || sun === "الأسد" || sun === "القوس") {
    traits += "تميل للمهن التي تتيح لك القيادة وإظهار إبداعك";
  } else if (sun === "الثور" || sun === "العذراء" || sun === "الجدي") {
    traits += "تنجح في المجالات التي تتطلب الثبات والمنهجية";
  } else if (sun === "الجوزاء" || sun === "الميزان" || sun === "الدلو") {
    traits += "تتفوق في المهن التي تعتمد على التواصل والأفكار المبتكرة";
  } else {
    traits += "تبرز في المجالات التي تتطلب الحدس والتعاطف";
  }
  
  traits += ". ";
  
  // Add midheaven if available
  if (midheaven) {
    traits += `مسارك المهني يتجه نحو ${midheaven === "الحمل" || midheaven === "الأسد" || midheaven === "القوس" ? "مجالات إبداعية أو قيادية" : 
              midheaven === "الثور" || midheaven === "العذراء" || midheaven === "الجدي" ? "مجالات عملية ومستقرة" :
              midheaven === "الجوزاء" || midheaven === "الميزان" || midheaven === "الدلو" ? "مجالات فكرية أو اجتماعية" :
              "مجالات تساعد الآخرين أو تتطلب إلهاماً"}.`;
  }
  
  return traits;
};

// Life path
const getLifePathProfile = (sun: string, moon: string, jupiter: string): string => {
  let traits = "";
  
  // Sun and moon combination
  if ((sun === "الحمل" || sun === "الأسد" || sun === "القوس") && 
      (moon === "الحمل" || moon === "الأسد" || moon === "القوس")) {
    traits += "مسارك الحياتي مليء بالطاقة والإبداع والمغامرات";
  } else if ((sun === "الثور" || sun === "العذراء" || sun === "الجدي") && 
             (moon === "الثور" || moon === "العذراء" || moon === "الجدي")) {
    traits += "مسارك الحياتي يركز على بناء أسس متينة والإنجازات العملية";
  } else if ((sun === "الجوزاء" || sun === "الميزان" || sun === "الدلو") && 
             (moon === "الجوزاء" || moon === "الميزان" || moon === "الدلو")) {
    traits += "مسارك الحياتي يتجه نحو التعلم المستمر والتواصل وتطوير الأفكار الجديدة";
  } else if ((sun === "السرطان" || sun === "العقرب" || sun === "الحوت") && 
             (moon === "السرطان" || sun === "العقرب" || sun === "الحوت")) {
    traits += "مسارك الحياتي عميق وتحويلي، يركز على النمو العاطفي والروحي";
  } else {
    traits += "مسارك الحياتي متنوع ومتعدد الأبعاد، يجمع بين جوانب مختلفة من شخصيتك";
  }
  
  return traits;
};

// Detect notable planetary patterns
const getNotablePlanetary = (chart: any): string[] | null => {
  const patterns = [];
  
  // Convert the planets object to an array format for analysis
  const planetsArray = Object.entries(chart.planets).map(([name, data]: [string, any]) => ({
    planet: name,
    sign: data.sign,
    degree: data.degree,
    retrograde: data.retrograde
  }));
  
  // Group planets by sign
  const planetsBySign: Record<string, any[]> = {};
  planetsArray.forEach(planet => {
    if (!planetsBySign[planet.sign]) {
      planetsBySign[planet.sign] = [];
    }
    planetsBySign[planet.sign].push(planet);
  });
  
  // Check for stellium (3 or more planets in one sign)
  Object.entries(planetsBySign).forEach(([sign, planets]) => {
    if (planets.length >= 3) {
      const planetNames = planets.map(p => planetNames[p.planet as keyof typeof planetNames] || p.planet).join("، ");
      patterns.push(`تراكم في برج ${getArabicZodiacSign(sign)} ${getZodiacEmoji(getArabicZodiacSign(sign))}: ${planetNames}. هذا يعزز تأثير برج ${getArabicZodiacSign(sign)} في شخصيتك ومسار حياتك.`);
    }
  });
  
  return patterns.length > 0 ? patterns : null;
};

