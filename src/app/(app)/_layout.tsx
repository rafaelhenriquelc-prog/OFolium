import { Redirect, Slot } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Sidebar } from '@/components/Sidebar';
import { BrandColors } from '@/constants/colors';
import { mobilePageContain } from '@/constants/layout';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeesProvider } from '@/contexts/EmployeesContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function AppShell() {
  const { isCompactLayout, insets } = useResponsiveLayout();

  return (
    <View style={styles.root}>
      <Sidebar />
      <View
        style={[
          styles.content,
          isCompactLayout && mobilePageContain,
          isCompactLayout && { paddingTop: insets.top },
        ]}>
        <Slot />
      </View>
      {isCompactLayout && <MobileBottomNav />}
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
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
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: BrandColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
