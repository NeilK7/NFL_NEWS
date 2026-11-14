import { createClient } from '@supabase/supabase-js';
import { UserPreferences } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_ruminate_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_ruminate_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteTeamIds: ['den', 'kc', 'sf'],
  primaryTeamId: 'den',
  favoritePlayerIds: [
    'p-den-4426338',
    'p-den-4241985',
    'p-den-4697815',
    'p-den-3128429',
    'p-den-4372016',
    'p-den-3051876',
    'p-den-4360248',
    'p-den-4258173',
    'p-den-4429013',
  ],
  favoriteTeams: ['den', 'kc', 'sf'],
  favoritePlayers: [
    'p-den-4426338',
    'p-den-4241985',
    'p-den-4697815',
    'p-den-3128429',
    'p-den-4372016',
    'p-den-3051876',
    'p-den-4360248',
    'p-den-4258173',
    'p-den-4429013',
  ],
  savedArticles: [],
  notificationsEnabled: true,
  theme: 'dark',
  hasCompletedOnboarding: true,
};

const STORAGE_KEY = 'gridiron_apex_user_prefs_v2';

function normalizePrefs(parsed: any): UserPreferences {
  const favTeams = parsed?.favoriteTeamIds || parsed?.favoriteTeams || DEFAULT_PREFERENCES.favoriteTeamIds;
  const favPlayers = parsed?.favoritePlayerIds || parsed?.favoritePlayers || DEFAULT_PREFERENCES.favoritePlayerIds;
  const primary = parsed?.primaryTeamId || favTeams[0] || 'den';

  return {
    ...DEFAULT_PREFERENCES,
    ...parsed,
    favoriteTeamIds: favTeams,
    primaryTeamId: primary,
    favoritePlayerIds: favPlayers,
    favoriteTeams: favTeams,
    favoritePlayers: favPlayers,
    hasCompletedOnboarding: true,
  };
}

export function getLocalPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(item);
    return normalizePrefs(parsed);
  } catch (e) {
    console.warn('Failed to load local preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  if (typeof window === 'undefined') return null;

  let localPrefs: UserPreferences | null = null;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (item) {
      localPrefs = normalizePrefs(JSON.parse(item));
    }
  } catch (e) {
    console.warn('Failed to parse localStorage preferences:', e);
  }

  // Also check server/cloud vault in case preferences were saved across sessions or browsers
  try {
    const res = await fetch('/api/users', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.preferences) {
        const cloudPrefs = normalizePrefs(data.preferences);
        if (!localPrefs) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudPrefs));
          return cloudPrefs;
        }
      }
    }
  } catch {
    // ignore network error and return localPrefs
  }

  return localPrefs;
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<UserPreferences> {
  const normalized = normalizePrefs(prefs);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.warn('localStorage write warning:', e);
    }

    // Persist to server + Supabase cloud vault via /api/users
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: normalized }),
    }).catch((err) => console.warn('Background cloud preference sync warning:', err));
  }

  return normalized;
}

export const savePreferences = saveUserPreferences;
