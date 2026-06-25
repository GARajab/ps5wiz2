import { createClient } from '@supabase/supabase-js';
import { Tutorial } from '../types';

let rawSupabaseUrl = (((import.meta as any).env?.VITE_SUPABASE_URL) || '').trim();
let rawSupabaseAnonKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '').trim();

// Defensive clean: strip any trailing slash or '/rest/v1' added during copy-paste from settings
if (rawSupabaseUrl.endsWith('/')) {
  rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
}
if (rawSupabaseUrl.endsWith('/rest/v1')) {
  rawSupabaseUrl = rawSupabaseUrl.substring(0, rawSupabaseUrl.length - 8);
}

const supabaseUrl = rawSupabaseUrl.trim();
const supabaseAnonKey = rawSupabaseAnonKey.trim();

// Check if Supabase keys exist and are not empty placeholders
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' && 
  supabaseUrl !== 'MY_SUPABASE_URL'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Standardize arrays (requirements/steps) from database regardless of format (JSON, Text Array, or custom separator)
function parseArrayField(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof field === 'string') {
    // If it is JSON stringified array, parse it
    if (field.startsWith('[') && field.endsWith(']')) {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
      } catch (e) {}
    }
    // Fallback split by newlines
    return field.split('\n').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

export async function getSupabaseTutorials(): Promise<Tutorial[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .order('min_firmware', { ascending: true });

    if (error) {
      // Try ordering by minFirmware instead if they used camelCase
      const { data: camelData, error: camelError } = await supabase
        .from('tutorials')
        .select('*')
        .order('minFirmware', { ascending: true });

      if (camelError) throw error;
      return (camelData || []).map((t: any) => mapRecordToTutorial(t));
    }

    return (data || []).map((t: any) => mapRecordToTutorial(t));
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
    throw err;
  }
}

// Maps both camelCase and snake_case properties to Tutorial object
function mapRecordToTutorial(t: any): Tutorial {
  return {
    id: t.id,
    name: t.name || '',
    minFirmware: Number(t.minFirmware !== undefined ? t.minFirmware : (t.min_firmware || 1.00)),
    maxFirmware: Number(t.maxFirmware !== undefined ? t.maxFirmware : (t.max_firmware || 12.00)),
    ps5Model: t.ps5Model || t.ps5_model || 'both',
    status: t.status || 'Stable',
    difficulty: t.difficulty || 'Medium',
    youtubeId: t.youtubeId || t.youtube_id || '',
    description: t.description || '',
    requirements: parseArrayField(t.requirements),
    steps: parseArrayField(t.steps)
  };
}

export async function upsertSupabaseTutorial(tutorial: Tutorial): Promise<Tutorial | null> {
  if (!supabase) return null;
  try {
    // We construct the payload supporting both camelCase and snake_case for maximum database schema tolerance!
    const payload = {
      id: tutorial.id,
      name: tutorial.name,
      min_firmware: tutorial.minFirmware,
      minFirmware: tutorial.minFirmware,
      max_firmware: tutorial.maxFirmware,
      maxFirmware: tutorial.maxFirmware,
      ps5_model: tutorial.ps5Model,
      ps5Model: tutorial.ps5Model,
      status: tutorial.status,
      difficulty: tutorial.difficulty,
      youtube_id: tutorial.youtubeId,
      youtubeId: tutorial.youtubeId,
      description: tutorial.description,
      requirements: tutorial.requirements,
      steps: tutorial.steps
    };

    const { data, error } = await supabase
      .from('tutorials')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      // Try again without snake_case mappings just in case table schema strictly only has camelCase
      const camelOnlyPayload = {
        id: tutorial.id,
        name: tutorial.name,
        minFirmware: tutorial.minFirmware,
        maxFirmware: tutorial.maxFirmware,
        ps5Model: tutorial.ps5Model,
        status: tutorial.status,
        difficulty: tutorial.difficulty,
        youtubeId: tutorial.youtubeId,
        description: tutorial.description,
        requirements: tutorial.requirements,
        steps: tutorial.steps
      };
      
      const { data: retryData, error: retryError } = await supabase
        .from('tutorials')
        .upsert(camelOnlyPayload, { onConflict: 'id' })
        .select();

      if (retryError) throw error;
      return retryData && retryData[0] ? mapRecordToTutorial(retryData[0]) : tutorial;
    }
    
    return data && data[0] ? mapRecordToTutorial(data[0]) : tutorial;
  } catch (err) {
    console.error('Error saving to Supabase:', err);
    throw err;
  }
}

export async function deleteSupabaseTutorial(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('tutorials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting from Supabase:', err);
    throw err;
  }
}

export function getSupabaseSQLScript(): string {
  return `-- Copy and run this script in your Supabase SQL Editor to set up the tutorials table!

-- Create the tutorials table
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_firmware NUMERIC NOT NULL,
  max_firmware NUMERIC NOT NULL,
  ps5_model TEXT NOT NULL,
  status TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  youtube_id TEXT,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
-- 1. Allow everyone to select (view) tutorials
CREATE POLICY "Allow public read access" 
  ON tutorials FOR SELECT 
  USING (true);

-- 2. Allow anonymous/authenticated users to insert, update and delete
CREATE POLICY "Allow full access for wizard managers" 
  ON tutorials FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Insert default templates to seed your new Supabase database!
INSERT INTO tutorials (id, name, min_firmware, max_firmware, ps5_model, status, difficulty, youtube_id, description, requirements, steps)
VALUES 
(
  'ps5-umtx-kernel',
  'PS5 Kernel Exploit (UMTX / BD-JB / Webkit)',
  1.00,
  4.51,
  'both',
  'Stable',
  'Medium',
  'b-hWeq-G99s',
  'A full kernel exploit for firmwares 1.00 through 4.51. It uses a Webkit vulnerability (or the Blu-ray Disc Java exploit on Disc consoles) combined with the UMTX kernel exploit to enable homebrew, custom settings, and backups.',
  '["A PS5 on firmware 4.51 or lower", "A PC or phone connected to the same local Wi-Fi network", "For Disc version: A rewritable Blu-ray Disc (BD-RE) and BD Writer (Optional)", "An exFAT formatted USB drive (for homebrew)"]'::jsonb,
  '["Navigate to PS5 Settings > Network > Settings > Set Up Internet Connection", "Highlight connection, press Options, select Advanced Settings", "Set DNS Settings to Manual. Set Primary DNS to 192.241.116.141", "Go back, restart console, open Settings > User''''s Guide", "Select matched exploit version to run the jailbreak payload", "If on Disc using BD-JB, insert burned disc payload instead", "Wait for Success message and check Settings > Debug Settings!"]'::jsonb
),
(
  'ps5-mast1c0re',
  'Mast1c0re PS4 Emulator Exploit',
  4.52,
  7.61,
  'both',
  'Alternative Method',
  'Hard',
  'eO2ZqLgLreE',
  'An exploit targeting the PS5''s built-in PS4 emulator using save game vulnerabilities. It does not provide full PS5 kernel access, but allows running PS4 homebrew, ISO backups, and retro emulators.',
  '["PS5 running firmware between 4.52 and 7.61", "Legitimate copy of the PS4 game Okage: Shadow King", "A PC or mobile device to send save files", "An active network connection on same network"]'::jsonb,
  '["Buy and download Okage: Shadow King from PS Store", "Download the mast1c0re save game exploit files on your PC", "Use save transfer tool to copy save files to your PS5 console", "Load Okage game on PS5 and restore the exploit save game", "Open the save game. The game crashes and boots mast1c0re", "Send homebrew .elf or PS4 ISO from PC to PS5 IP on port 9020"]'::jsonb
),
(
  'ps5-no-jailbreak',
  'No Public Jailbreak Available (Stay & Block Updates)',
  7.62,
  12.00,
  'both',
  'No Jailbreak',
  'None',
  '8zD6H5K7P-Q',
  'There is currently no public kernel exploit or jailbreak for PS5 consoles on firmware 7.62 or higher. The golden rule of PlayStation hacking is: STAY on the lowest possible firmware and NEVER update your console.',
  '["A PS5 on firmware 7.62 or above", "A firm commitment to not updating your system!", "Automatic software updates disabled in settings"]'::jsonb,
  '["Disable auto-updates: Settings > System > System Software Update and Settings", "Turn off Download Update Files and Install Update Files", "Optionally set up Al Azif''s DNS to block update servers entirely", "Wait patiently. Your current firmware is your best chance!"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
`;
}
