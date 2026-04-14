// Singleton Supabase Client
// Uses the CDN-loaded window.supabase to ensure total compatibility and no multiple GoTrue versions.

const supabaseUrl = 'https://sueyfodlqcviojivlxgv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZXlmb2RscWN2aW9qaXZseGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzU4NTMsImV4cCI6MjA5MTI1MTg1M30.g40c4ko9uFKOdN2x4tvQQg-IuWx2ZB4K8_fsZpgeIDw';

if (!window.aficSupabase) {
    console.log("Setting up Unified Supabase Singleton...");
    if (window.supabase?.createClient) {
        window.aficSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
}

export const supabase = window.aficSupabase;

export const getSupabase = () => window.aficSupabase;
