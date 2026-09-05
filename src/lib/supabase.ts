import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import './installLocalStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is missing. Define it in your local .env file (see .env.example).',
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing. Define it in your local .env file (see .env.example).',
  );
}

const authStorage =
  typeof globalThis !== 'undefined' && 'localStorage' in globalThis
    ? globalThis.localStorage
    : undefined;

const isWebBrowser =
  Platform.OS === 'web' &&
  typeof globalThis !== 'undefined' &&
  'window' in globalThis;

export const isInitialRecoveryUrl =
  isWebBrowser &&
  (globalThis.window.location.hash.includes('type=recovery') ||
    globalThis.window.location.search.includes('code='));

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(authStorage ? { storage: authStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWebBrowser,
  },
});
