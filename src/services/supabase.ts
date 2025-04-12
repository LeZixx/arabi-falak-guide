
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Use the existing Supabase client that's already configured
export const supabase = supabaseClient;

// Check if Supabase is properly connected
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try to get a simple response from Supabase
    const { data, error } = await supabase
      .from('astrology_charts')
      .select('count')
      .limit(1) as any;
    
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist - needs to be created
        toast.error('Supabase tables not found. Please create the required tables.', {
          description: 'Check the console for SQL instructions.'
        });
        
        console.error('Error: Required Supabase tables not found');
        console.log('Please create the following tables in your Supabase project:');
        console.log(`
-- Table: astrology_charts
CREATE TABLE astrology_charts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  chart_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: horoscope_predictions
CREATE TABLE horoscope_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  chart_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  lucky_number INTEGER,
  lucky_star TEXT,
  lucky_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL
);
        `);
        return false;
      } else {
        // Other error
        toast.error('Supabase connection error', {
          description: error.message
        });
        console.error('Supabase connection error:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    toast.error('Supabase connection failed', {
      description: 'Please check your Supabase credentials'
    });
    console.error('Supabase connection failed:', error);
    return false;
  }
};

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
    .select() as any;

  if (error && error.code === '42P01') {
    // Table doesn't exist
    await checkSupabaseConnection();
  }

  return { data: data?.[0] || null, error };
};

export const getUserChart = async (userId: string): Promise<{ data: AstrologyChart | null; error: any }> => {
  const { data, error } = await supabase
    .from('astrology_charts')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any;

  if (error && error.code === '42P01') {
    // Table doesn't exist
    await checkSupabaseConnection();
  }

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
    .select() as any;

  if (error && error.code === '42P01') {
    // Table doesn't exist
    await checkSupabaseConnection();
  }

  return { data: data?.[0] || null, error };
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
    .single() as any;

  if (error && error.code === '42P01') {
    // Table doesn't exist
    await checkSupabaseConnection();
  }

  return { data, error };
};
