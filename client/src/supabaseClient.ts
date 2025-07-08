import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvspnwhyudkvvxsmhttu.supabase.co'; // Substitua pelo seu
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2c3Bud2h5dWRrdnZ4c21odHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NzY0MDUsImV4cCI6MjA2NTI1MjQwNX0.IqUrduexGuFOupZcvGUTU5q2_Mn9ys7zU6zALqQrV3M'; // Substitua pelo seu

export const supabase = createClient(supabaseUrl, supabaseAnonKey);