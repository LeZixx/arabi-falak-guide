
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import swisseph from "https://esm.sh/swisseph@0.5.17";

// Configure Swiss Ephemeris
const ephePath = "/var/lib/swisseph"; // This is where ephemeris files are typically stored
swisseph.swe_set_ephe_path(ephePath);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zodiac signs
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

// House systems
const houseSystemMap = {
  'P': 'Placidus',
  'K': 'Koch',
  'O': 'Porphyrius',
  'R': 'Regiomontanus',
  'C': 'Campanus',
  'E': 'Equal',
  'W': 'Whole Sign',
  'B': 'Alcabitus',
};

// Convert date string and time string to Julian day
function getJulianDay(dateStr: string, timeStr: string, longitude: number) {
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

// Calculate planetary positions
function calculatePlanetaryPositions(julDay: number) {
  const planets = [];
  
  // Calculate positions for each planet
  for (let i = 0; i <= 9; i++) {
    // Skip Earth (SE_EARTH = 3 in Swiss Ephemeris)
    if (i === 3) continue;
    
    try {
      const result = swisseph.swe_calc_ut(julDay, i, swisseph.SEFLG_SPEED);
      const longitude = result.longitude;
      const signIndex = Math.floor(longitude / 30);
      const degree = longitude % 30;
      const retrograde = result.speedLong < 0;
      
      planets.push({
        planet: planetNames[i] || `Planet ${i}`,
        sign: zodiacSigns[signIndex],
        degree: parseFloat(degree.toFixed(2)),
        retrograde: retrograde
      });
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
  
  if (result && result.house) {
    for (let i = 1; i <= 12; i++) {
      const longitude = result.house[i - 1];
      const signIndex = Math.floor(longitude / 30);
      houses.push({
        house: i,
        sign: zodiacSigns[signIndex]
      });
    }
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
  
  if (result && result.ascendant) {
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
            aspect: aspectDef.name,
            orb: parseFloat(orb.toFixed(2))
          });
          break;  // Only count the closest aspect
        }
      }
    }
  }
  
  return aspects;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { birthDate, birthTime, birthPlace, latitude, longitude } = await req.json();
    
    if (!birthDate || !birthTime || !latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Calculate Julian day
    const julDay = getJulianDay(birthDate, birthTime, longitude);
    
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
      aspects
    };
    
    return new Response(
      JSON.stringify(chart),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error calculating birth chart:", error);
    return new Response(
      JSON.stringify({ error: "Failed to calculate birth chart", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
