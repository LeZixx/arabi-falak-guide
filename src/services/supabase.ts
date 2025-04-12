
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase credentials (will be provided by Lovable)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table interfaces
export interface AstrologyChart {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number | null;
  longitude: number | null;
  chart_data: any;  // JSON data with all planetary positions
  created_at: string;
}

export interface HoroscopePrediction {
  id: string;
  user_id: string;
  chart_id: string;
  type: string; // daily, love, career, health
  content: string;
  lucky_number: number;
  lucky_star: string;
  lucky_color: string;
  created_at: string;
  valid_until: string;
}

// Functions to interact with the database
export const saveUserChart = async (
  userId: string,
  birthDate: string,
  birthTime: string,
  birthPlace: string,
  chartData: any
): Promise<{ data: AstrologyChart | null; error: any }> => {
  const { data, error } = await supabase
    .from('astrology_charts')
    .insert({
      user_id: userId,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace,
      chart_data: chartData,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return { data, error };
};

export const getUserChart = async (userId: string): Promise<{ data: AstrologyChart | null; error: any }> => {
  const { data, error } = await supabase
    .from('astrology_charts')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { data, error };
};

export const saveHoroscopePrediction = async (
  userId: string,
  chartId: string,
  type: string,
  content: string,
  luckyNumber: number,
  luckyStar: string,
  luckyColor: string,
  validUntil: string
): Promise<{ data: HoroscopePrediction | null; error: any }> => {
  const { data, error } = await supabase
    .from('horoscope_predictions')
    .insert({
      user_id: userId,
      chart_id: chartId,
      type,
      content,
      lucky_number: luckyNumber,
      lucky_star: luckyStar,
      lucky_color: luckyColor,
      created_at: new Date().toISOString(),
      valid_until: validUntil
    })
    .select()
    .single();

  return { data, error };
};

export const getLatestHoroscope = async (
  userId: string,
  type: string
): Promise<{ data: HoroscopePrediction | null; error: any }> => {
  const { data, error } = await supabase
    .from('horoscope_predictions')
    .select()
    .eq('user_id', userId)
    .eq('type', type)
    .gte('valid_until', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { data, error };
};
