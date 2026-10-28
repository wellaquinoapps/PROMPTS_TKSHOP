import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// No Vite as variáveis do .env são acessadas via import.meta.env
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://knzdxmelubcuaepcvhej.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuemR4bWVsdWJjdWFlcGN2aGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzI5NDgsImV4cCI6MjEwODcwODk0OH0.FwiUU_3cOo60MRbjuYGroan9SDZhI1gTDi20gRLql2o';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
