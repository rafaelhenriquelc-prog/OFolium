import { Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { AppContentBackground } from '@/components/AppContentBackground';
import { DemoBanner } from '@/components/DemoBanner';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Sidebar } from '@/components/Sidebar';
import { BrandColors } from '@/constants/colors';
import { mobilePageContain } from '@/constants/layout';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { AppShellUIProvider } from '@/contexts/AppShellUIContext';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeesProvider } from '@/contexts/EmployeesContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function AppShell() {
  const { isCompactLayout } = useResponsiveLayout();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isCompactLayout) {
      setSidebarCollapsed(false);
    }
  }, [isCompactLayout]);

  return (
    <AppShellUIProvider>
      <View style={styles.root}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
        />
        <View style={styles.mainColumn}>
          <DemoBanner />
          <AppContentBackground>
            <View
              style={[
                styles.content,
                isCompactLayout && mobilePageContain,
              ]}>
              <Slot />
            </View>
          </AppContentBackground>
        </View>
        {isCompactLayout && <MobileBottomNav />}
      </View>
    </AppShellUIProvider>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <PlanProvider>
        <EmployeesProvider>
          <AppDataProvider>
            <AppShell />
          </AppDataProvider>
        </EmployeesProvider>
      </PlanProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    minWidth: 0,
    backgroundColor: BrandColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    position: 'relative',
    backgroundColor: 'transparent',
  },
});
