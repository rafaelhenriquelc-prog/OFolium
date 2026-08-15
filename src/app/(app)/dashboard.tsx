import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { EmployeeTable } from '@/components/EmployeeTable';
import { Header } from '@/components/Header';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { RecentActivity } from '@/components/RecentActivity';
import { StatCardsRow } from '@/components/StatCard';
import { TipCard } from '@/components/TipCard';
import { WeeklyRecords } from '@/components/WeeklyRecords';
import { useAppData } from '@/contexts/AppDataContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { mobilePageContain, mobileStackedSection } from '@/constants/layout';

export default function DashboardScreen() {
  const { ProFeatureModalHost } = useAppData();
  const { isMobile, isCompactLayout, contentPaddingHorizontal, contentPaddingBottom } =
    useResponsiveLayout();
  const isCompact = isCompactLayout;
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

  useEffect(() => {
    if (isCompact && isNotificationsPanelOpen) {
      setIsNotificationsPanelOpen(false);
    }
  }, [isCompact, isNotificationsPanelOpen]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isNotificationsPanelOpen || isCompact) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsPanelOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('[data-notifications-panel="true"]') ||
        target?.closest('[data-notifications-trigger="true"]')
      ) {
        return;
      }
      setIsNotificationsPanelOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isCompact, isNotificationsPanelOpen]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsNotificationsPanelOpen(false);
      };
    }, []),
  );

  const toggleNotificationsPanel = () => {
    setIsNotificationsPanelOpen((current) => !current);
  };

  const closeNotificationsPanel = () => {
    setIsNotificationsPanelOpen(false);
  };

  return (
    <View style={styles.mainArea}>
      <ScrollView
        style={[styles.scrollView, isCompactLayout && mobilePageContain]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: contentPaddingHorizontal,
            paddingBottom: contentPaddingBottom,
            paddingTop: isCompactLayout ? (isMobile ? 12 : 16) : 32,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <Header
          onNotificationPress={toggleNotificationsPanel}
          isNotificationsPanelOpen={isNotificationsPanelOpen}
        />
        <StatCardsRow />

        <View style={[styles.middleRow, isCompactLayout && styles.middleRowMobile]}>
          <View style={isCompactLayout ? mobileStackedSection : undefined}>
            <EmployeeTable />
          </View>
          <View style={isCompactLayout ? mobileStackedSection : undefined}>
            <WeeklyRecords />
          </View>
        </View>

        <View style={[styles.bottomRow, isCompactLayout && styles.bottomRowMobile]}>
          <View style={isCompactLayout ? mobileStackedSection : undefined}>
            <RecentActivity />
          </View>
          <View style={isCompactLayout ? mobileStackedSection : undefined}>
            <TipCard />
          </View>
        </View>
      </ScrollView>

      <NotificationsPanel
        isOpen={isNotificationsPanelOpen}
        onToggle={toggleNotificationsPanel}
        onClose={closeNotificationsPanel}
        isCompact={isCompact}
      />
      <ProFeatureModalHost />
    </View>
  );
}

const styles = StyleSheet.create({
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 16,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  middleRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  bottomRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});
