import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iawrnzqubhzphlouriva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhd3JuenF1Ymh6cGhsb3VyaXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDI0NDgsImV4cCI6MjA5MDAxODQ0OH0.Vzt6jIHuBtwsLyJVakvDgupEhnDSsSm_koZlJFMCsQA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
