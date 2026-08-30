import { Redirect } from 'expo-router';

import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return <Redirect href={isAuthenticated ? '/dashboard' : '/login'} />;
}
