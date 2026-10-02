import { Preferences } from '@capacitor/preferences';
import { UserProfile } from '../types';

const KEYS = {
  USER_SESSION: 'ola_user_session',
  SERVER_URL: 'ola_server_url',
  SUPABASE_URL: 'ola_supabase_url',
  SUPABASE_ANON_KEY: 'ola_supabase_anon_key',
  LAST_ATTENDANCE: 'ola_last_attendance'
};

export const StorageService = {
  async saveUser(user: UserProfile): Promise<void> {
    await Preferences.set({
      key: KEYS.USER_SESSION,
      value: JSON.stringify(user)
    });
  },

  async getUser(): Promise<UserProfile | null> {
    const { value } = await Preferences.get({ key: KEYS.USER_SESSION });
    if (!value) return null;
    try {
      return JSON.parse(value) as UserProfile;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    await Preferences.remove({ key: KEYS.USER_SESSION });
  },

  async getServerUrl(): Promise<string> {
    const { value } = await Preferences.get({ key: KEYS.SERVER_URL });
    return value || 'http://ola.labuhanbatukab.go.id';
  },

  async setServerUrl(url: string): Promise<void> {
    await Preferences.set({ key: KEYS.SERVER_URL, value: url });
  },

  async getCustomSupabaseConfig(): Promise<{ url: string; anonKey: string } | null> {
    const url = (await Preferences.get({ key: KEYS.SUPABASE_URL })).value;
    const anonKey = (await Preferences.get({ key: KEYS.SUPABASE_ANON_KEY })).value;
    if (url && anonKey) {
      return { url, anonKey };
    }
    return null;
  },

  async setCustomSupabaseConfig(url: string, anonKey: string): Promise<void> {
    await Preferences.set({ key: KEYS.SUPABASE_URL, value: url });
    await Preferences.set({ key: KEYS.SUPABASE_ANON_KEY, value: anonKey });
  }
};
