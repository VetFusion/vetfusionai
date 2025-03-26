// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mphhbsqrakhsfqdskpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waGhic3FyYWtoc2ZxZHNrcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MTc3MTgsImV4cCI6MjA1ODQ5MzcxOH0.Kc6R8ur2iQnh34gwuLyboB7GgrMG0So-zi7_2fyIfBU';

export const supabase = createClient(supabaseUrl, supabaseKey);
