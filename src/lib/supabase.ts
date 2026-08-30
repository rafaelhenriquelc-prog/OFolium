import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
