import { createClient } from '@supabase/supabase-js';
import { UserPreferences } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_ruminate_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_ruminate_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteTeamIds: ['kc', 'sf'],
  primaryTeamId: 'kc',
  favoritePlayerIds: ['p-mahomes', 'p-purdy', 'p-lamar', 'p-cmc'],
  favoriteTeams: ['kc', 'sf'],
  favoritePlayers: ['p-mahomes', 'p-purdy', 'p-lamar', 'p-cmc'],
  savedArticles: [],
  notificationsEnabled: true,
  theme: 'dark',
  hasCompletedOnboarding: false,
};

const STORAGE_KEY = 'gridiron_apex_user_prefs';

export function getLocalPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(item);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      favoriteTeamIds: parsed.favoriteTeamIds || parsed.favoriteTeams || DEFAULT_PREFERENCES.favoriteTeamIds,
      primaryTeamId: parsed.primaryTeamId || (parsed.favoriteTeamIds?.[0]) || 'kc',
      favoritePlayerIds: parsed.favoritePlayerIds || parsed.favoritePlayers || DEFAULT_PREFERENCES.favoritePlayerIds,
    };
  } catch (e) {
    console.warn('Failed to load local preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      favoriteTeamIds: parsed.favoriteTeamIds || parsed.favoriteTeams || DEFAULT_PREFERENCES.favoriteTeamIds,
      primaryTeamId: parsed.primaryTeamId || (parsed.favoriteTeamIds?.[0]) || 'kc',
      favoritePlayerIds: parsed.favoritePlayerIds || parsed.favoritePlayers || DEFAULT_PREFERENCES.favoritePlayerIds,
    };
  } catch (e) {
    console.warn('Failed to load user preferences:', e);
    return null;
  }
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  const normalized: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    favoriteTeams: prefs.favoriteTeamIds,
    favoritePlayers: prefs.favoritePlayerIds,
    hasCompletedOnboarding: true,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            preferences: normalized,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (e) {
      console.warn('Supabase sync skipped:', e);
    }
  }
}

export const savePreferences = saveUserPreferences;
