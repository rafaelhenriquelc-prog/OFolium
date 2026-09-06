import { Redirect, type Href } from 'expo-router';

import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { isInitialRecoveryUrl } from '@/lib/supabase';

function getResetPasswordHref(): Href {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    const { search, hash } = globalThis.window.location;
    if (search || hash) {
      return `/reset-password${search}${hash}` as Href;
    }
  }

  return '/reset-password';
}

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (isInitialRecoveryUrl) {
    return <Redirect href={getResetPasswordHref()} />;
  }

  return <Redirect href={isAuthenticated ? '/dashboard' : '/login'} />;
}
