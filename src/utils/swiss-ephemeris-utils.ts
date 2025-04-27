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
      timezone: "UTC"
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
    
    // Only proceed with full chart if birth time is provided
    if (!birthTime) {
      return {
        julianDay,
        timestamp: natalChartData.timestamp,
        coordinates: {
          latitude: coords.lat,
          longitude: coords.lon
        },
        hasBirthTime: false
      };
    }
    
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
    
    return {
      ...fullChartData,
      julianDay,
      timestamp: natalChartData.timestamp,
      coordinates: {
        latitude: coords.lat,
        longitude: coords.lon
      },
      hasBirthTime: true
    };
    
  } catch (error) {
    console.error("Error fetching natal chart:", error);
    throw error;
  }
};

export const generateBirthChartInterpretation = (chart: any, hasBirthTime: boolean): string => {
  try {
    // Comprehensive interpretation logic using EXACT API data
    let interpretation = `✨ تحليل خريطتك الفلكية الشاملة ✨\n\n`;

    // Sun Sign Interpretation
    const sunSign = chart.planets.Sun.sign;
    interpretation += `☀️ الشمس في برج ${sunSign}:\n`;
    interpretation += getSunSignInterpretation(sunSign) + "\n\n";

    // Moon Sign Interpretation
    const moonSign = chart.planets.Moon.sign;
    interpretation += `🌙 القمر في برج ${moonSign}:\n`;
    interpretation += getMoonSignInterpretation(moonSign) + "\n\n";

    // Mercury Sign Interpretation
    const mercurySign = chart.planets.Mercury.sign;
    const mercuryRetrograde = chart.planets.Mercury.retrograde;
    interpretation += `☿️ عطارد في برج ${mercurySign} ${mercuryRetrograde ? "(تراجع)" : ""}:\n`;
    interpretation += getMercurySignInterpretation(mercurySign, mercuryRetrograde) + "\n\n";

    // Venus Sign Interpretation
    const venusSign = chart.planets.Venus.sign;
    const venusRetrograde = chart.planets.Venus.retrograde;
    interpretation += `♀️ الزهرة في برج ${venusSign} ${venusRetrograde ? "(تراجع)" : ""}:\n`;
    interpretation += getVenusSignInterpretation(venusSign, venusRetrograde) + "\n\n";

    // Mars Sign Interpretation
    const marsSign = chart.planets.Mars.sign;
    const marsRetrograde = chart.planets.Mars.retrograde;
    interpretation += `♂️ المريخ في برج ${marsSign} ${marsRetrograde ? "(تراجع)" : ""}:\n`;
    interpretation += getMarsSignInterpretation(marsSign, marsRetrograde) + "\n\n";

    // Ascendant Interpretation (if birth time available)
    if (hasBirthTime) {
      const ascendantSign = chart.ascendant.sign;
      interpretation += `🌅 الطالع في برج ${ascendantSign}:\n`;
      interpretation += getAscendantSignInterpretation(ascendantSign) + "\n\n";
    } else {
      interpretation += "📝 ملاحظة: لم يتم توفير وقت الميلاد، لذا لا يمكن حساب الطالع بدقة.\n\n";
    }

    return interpretation;
  } catch (error) {
    console.error("Error generating birth chart interpretation:", error);
    return "عذرًا، حدث خطأ أثناء توليد التفسير الفلكي. يرجى المحاولة مرة أخرى.";
  }
};

// Detailed interpretation functions for each planet sign
const getSunSignInterpretation = (sign: string): string => {
  // Comprehensive interpretations for each sign
  const interpretations: Record<string, string> = {
    "Libra": "تتميز بشخصية متوازنة وديبلوماسية، تسعى دائماً للعدالة والتناغم في حياتك. لديك حس فني متطور وقدرة على رؤية وجهات النظر المختلفة. تميل للتعاون والشراكات المتوازنة، وتجد سعادتك في خلق توازن في العلاقات والمواقف.",
    "Aries": "تتميز بالشجاعة والاندفاع، وتحب أن تكون في المقدمة. أنت قائد بالفطرة ومتحمس لكل ما هو جديد.",
    "Taurus": "تتميز بالصبر والثبات، وتقدر الجمال والراحة. أنت شخص عملي وموثوق.",
    "Gemini": "تتميز بالذكاء والفضول، وتحب التواصل والتعلم. أنت شخص اجتماعي ومتعدد المواهب.",
    "Cancer": "تتميز بالعاطفة والحساسية، وتحب العائلة والمنزل. أنت شخص وفي ومهتم بالآخرين.",
    "Leo": "تتميز بالكرم والإبداع، وتحب أن تكون محط الأنظار. أنت شخص واثق ومحب للحياة.",
    "Virgo": "تتميز بالدقة والتحليل، وتحب النظام والترتيب. أنت شخص عملي ومنظم.",
    "Scorpio": "تتميز بالقوة والعزيمة، وتحب الغموض والتحول. أنت شخص شغوف ومخلص.",
    "Sagittarius": "تتميز بالتفاؤل والمغامرة، وتحب السفر والاستكشاف. أنت شخص حر ومستقل.",
    "Capricorn": "تتميز بالطموح والمسؤولية، وتحب النجاح والتقدير. أنت شخص جاد ومجتهد.",
    "Aquarius": "تتميز بالابتكار والاستقلالية، وتحب التغيير والتجديد. أنت شخص فريد ومفكر.",
    "Pisces": "تتميز بالرحمة والخيال، وتحب الفن والروحانية. أنت شخص حساس ومتعاطف."
  };
  
  return interpretations[sign] || "لم يتم العثور على تفسير محدد لهذا البرج.";
};

const getMoonSignInterpretation = (sign: string): string => {
  const interpretations: Record<string, string> = {
    "Libra": "تحتاج إلى التوازن والانسجام في حياتك العاطفية. تسعى للعلاقات المتوازنة وتكره الصراعات.",
    "Aries": "تعبر عن مشاعرك بصدق واندفاع. تحتاج إلى مساحة حرة للتعبير عن نفسك.",
    "Taurus": "تبحث عن الاستقرار والأمان في علاقاتك. تقدر اللحظات الهادئة والمريحة.",
    "Gemini": "تحتاج إلى التحفيز الفكري والتواصل في علاقاتك. تحب التنوع والتجديد.",
    "Cancer": "تعتني بمن حولك وتحتاج إلى الشعور بالأمان والحماية. تقدر العائلة والتقاليد.",
    "Leo": "تحب أن تكون محط اهتمام وتقدير في علاقاتك. تعبر عن مشاعرك بحماس وكرم.",
    "Virgo": "تحتاج إلى النظام والترتيب في حياتك العاطفية. تعبر عن حبك بالخدمة والاهتمام بالتفاصيل.",
    "Scorpio": "تعيش مشاعرك بعمق وشغف. تحتاج إلى علاقات صادقة ومخلصة.",
    "Sagittarius": "تحتاج إلى الحرية والمغامرة في علاقاتك. تحب استكشاف آفاق جديدة.",
    "Capricorn": "تأخذ علاقاتك بجدية ومسؤولية. تبحث عن الاستقرار والالتزام على المدى الطويل.",
    "Aquarius": "تحتاج إلى مساحة شخصية واستقلالية في علاقاتك. تقدر الصداقة والمساواة.",
    "Pisces": "تتعاطف مع الآخرين وتحتاج إلى علاقات روحية. تحب الأحلام والخيال."
  };
  
  return interpretations[sign] || "لم يتم العثور على تفسير محدد لهذا البرج.";
};

const getMercurySignInterpretation = (sign: string, retrograde: boolean): string => {
  const interpretations: Record<string, string> = {
    "Libra": "تتواصل بلطف ودبلوماسية، وتسعى للعدالة والتوازن في أفكارك. تقدر الحوار البناء والتعاون.",
    "Aries": "تعبر عن أفكارك بجرأة واندفاع. أنت مباشر وصريح في كلامك.",
    "Taurus": "تفكر بتأنٍ وعملية. تحتاج إلى وقت لمعالجة المعلومات الجديدة.",
    "Gemini": "تتواصل بذكاء وفضول. تحب تبادل الأفكار والمعلومات.",
    "Cancer": "تفكر بعاطفة وحدس. تتأثر أفكارك بمشاعرك وذكرياتك.",
    "Leo": "تعبر عن أفكارك بثقة وإبداع. تحب أن تكون مسموعاً ومؤثراً.",
    "Virgo": "تحلل المعلومات بدقة وتهتم بالتفاصيل. لديك عقل نقدي ومنظم.",
    "Scorpio": "تفكر بعمق وتبحث عما هو مخفي. لديك قدرة على كشف الحقائق والأسرار.",
    "Sagittarius": "تفكر بتفاؤل وفلسفة. تحب استكشاف أفكار جديدة.",
    "Capricorn": "تفكر بطريقة منظمة وعملية. تقيم الأفكار بناءً على فائدتها الواقعية.",
    "Aquarius": "تفكر بطريقة مبتكرة وغير تقليدية. تستمتع بالأفكار الثورية والمستقبلية.",
    "Pisces": "تفكر بخيال وإلهام. قد تجد صعوبة في التعبير عن أفكارك بوضوح دائماً."
  };
  
  let interpretation = interpretations[sign] || "لم يتم العثور على تفسير محدد لهذا البرج.";
  if (retrograde) {
    interpretation += " قد تواجه بعض التأخير أو التحديات في التواصل والتعبير عن أفكارك.";
  }
  return interpretation;
};

const getVenusSignInterpretation = (sign: string, retrograde: boolean): string => {
  const interpretations: Record<string, string> = {
    "Libra": "تحب الجمال والتناغم في علاقاتك. تسعى للعدالة والإنصاف في الحب.",
    "Aries": "تحب المغامرة والإثارة في الحب. تنجذب إلى الشركاء الواثقين والمستقلين.",
    "Taurus": "تحب الراحة والاستقرار في الحب. تقدر اللحظات الهادئة والممتعة مع شريكك.",
    "Gemini": "تحتاج إلى التحفيز الفكري والتواصل في الحب. تنجذب إلى الشركاء الأذكياء والاجتماعيين.",
    "Cancer": "تحب الرعاية والحماية في الحب. تقدر العائلة والمنزل.",
    "Leo": "تحب الإعجاب والتقدير في الحب. تنجذب إلى الشركاء الذين يظهرون لك الاهتمام.",
    "Virgo": "تحب الخدمة والاهتمام بالتفاصيل في الحب. تقدر الشركاء العمليين والمنظمين.",
    "Scorpio": "تحب الشغف والعمق في الحب. تنجذب إلى الشركاء المخلصين والمتحمسين.",
    "Sagittarius": "تحب الحرية والمغامرة في الحب. تنجذب إلى الشركاء الذين يشاركونك حب الاستكشاف.",
    "Capricorn": "تحب الالتزام والمسؤولية في الحب. تقدر الشركاء الجادين والمجتهدين.",
    "Aquarius": "تحب الصداقة والاستقلالية في الحب. تنجذب إلى الشركاء الفريدين والمبتكرين.",
    "Pisces": "تحب الرومانسية والخيال في الحب. تنجذب إلى الشركاء الحساسين والمتعاطفين."
  };
  
  let interpretation = interpretations[sign] || "لم يتم العثور على تفسير محدد لهذا البرج.";
  if (retrograde) {
    interpretation += " قد تواجه بعض التحديات في العلاقات أو صعوبة في التعبير عن مشاعرك.";
  }
  return interpretation;
};

const getMarsSignInterpretation = (sign: string, retrograde: boolean): string => {
  const interpretations: Record<string, string> = {
    "Libra": "تتصرف بدبلوماسية وتوازن، وتسعى للعدالة والانسجام في أفعالك. قد تتردد قبل اتخاذ القرارات الحاسمة.",
    "Aries": "تتصرف بشجاعة واندفاع، وتبادر بقوة لتحقيق ما تريد. قد تكون متهوراً أحياناً.",
    "Taurus": "تتصرف بثبات وصبر، وتعمل بجد لتحقيق أهدافك المادية. قد تكون عنيداً في بعض الأحيان.",
    "Gemini": "تتصرف بذكاء وسرعة، وتستخدم قدرتك على التواصل لتحقيق ما تريد. قد تكون متقلباً في اهتماماتك.",
    "Cancer": "تتصرف بعاطفة وحدس، وتدافع بقوة عن من تحب وما تؤمن به. قد تكون حساساً جداً.",
    "Leo": "تتصرف بثقة وإبداع، وتسعى للاعتراف بإنجازاتك. قد تكون متطلباً للاهتمام.",
    "Virgo": "تتصرف بدقة وكفاءة، وتهتم بالتفاصيل. قد تكون ناقداً لنفسك وللآخرين.",
    "Scorpio": "تتصرف بعمق وتصميم، ولديك قدرة هائلة على التركيز وتحقيق أهدافك. قد تكون غامضاً ومسيطراً.",
    "Sagittarius": "تتصرف بتفاؤل ومغامرة، وتبحث عن توسيع آفاقك وخبراتك باستمرار. قد تكون مفرطاً في التفاؤل.",
    "Capricorn": "تتصرف بجدية ومسؤولية، وتضع خططاً طويلة المدى وتلتزم بها. قد تكون متحفظاً جداً.",
    "Aquarius": "تتصرف بطرق غير تقليدية، وتدافع عن آرائك المستقلة وأفكارك المبتكرة. قد تكون متمرداً.",
    "Pisces": "تتصرف بناءً على حدسك وإلهامك، وقد تكون متردداً أحياناً في المواقف التي تتطلب حسماً. قد تكون مثالياً جداً."
  };
  
  let interpretation = interpretations[sign] || "لم يتم العثور على تفسير محدد لهذا البرج.";
  if (retrograde) {
    interpretation += " قد تواجه بعض الإحباط أو التأخير في تحقيق أهدافك.";
  }
  return interpretation;
};

const getAscendantSignInterpretation = (sign: string): string => {
  const interpretations: Record<string, string> = {
    "Libra": "تظهر للعالم كشخص دبلوماسي ولطيف ومنصف. يراك الناس شخصاً اجتماعياً يسعى للتوازن والانسجام.",
    "Aries": "تظهر للعالم كشخص مبادر وجريء ومستقل. يراك الناس مفعماً بالطاقة والحماس.",
    "Taurus": "تظهر للعالم كشخص مستقر وموثوق وعملي. يراك الناس شخصاً جديراً بالثقة.",
    "Gemini": "تظهر للعالم كشخص ذكي وفضولي واجتماعي. يراك الناس شخصاً مرحاً ومثيراً للاهتمام.",
    "Cancer": "تظهر للعالم كشخص حساس وراعٍ وعاطفي. يراك الناس شخصاً دافئاً وودوداً.",
    "Leo": "تظهر للعالم كشخص واثق وكريم ومبدع. يراك الناس قائداً طبيعياً.",
    "Virgo": "تظهر للعالم كشخص منظم ودقيق ومفيد. يراك الناس شخصاً عملياً وموثوقاً.",
    "Scorpio": "تظهر للعالم كشخص غامض وعميق ومكثف. يراك الناس شخصاً قوياً ومسيطراً.",
    "Sagittarius": "تظهر للعالم كشخص متفائل ومغامر وصريح. يراك الناس شخصاً منفتحاً ومستقلاً.",
    "Capricorn": "تظهر للعالم كشخص جدي ومسؤول وطموح. يراك الناس شخصاً جديراً بالاحترام.",
    "Aquarius": "تظهر للعالم كشخص مستقل وفريد ومبتكر. يراك الناس شخصاً غير تقليدي.",
    "Pisces": "تظهر للعالم كشخص حساس وحالم ومتعاطف. يراك الناس شخصاً روحانياً ولطيفاً."
  };
  
  return interpretations[sign] || "لم يتم العثور على تفسير محدد لهذا البرج.";
};
// Similar detailed functions for Moon, Mercury, Venus, Mars, and Ascendant...
