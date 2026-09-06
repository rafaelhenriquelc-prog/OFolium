import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { EmployeeTable } from '@/components/EmployeeTable';
import { Header } from '@/components/Header';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { RecentActivity } from '@/components/RecentActivity';
import { StatCardsRow } from '@/components/StatCard';
import { TipCard } from '@/components/TipCard';
import { WeeklyRecords } from '@/components/WeeklyRecords';
import { BrandColors } from '@/constants/colors';
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
      <Image
        source={require('@/assets/images/fundo_geo2.png')}
        style={styles.backgroundImage}
        contentFit="cover"
        contentPosition="center"
      />
      <View pointerEvents="none" style={styles.backgroundOverlay} />
      <ScrollView
        style={[styles.scrollView, styles.scrollViewTransparent, isCompactLayout && mobilePageContain]}
        contentContainerStyle={[
          styles.scrollContent,
          styles.scrollContentTransparent,
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
    backgroundColor: BrandColors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
    zIndex: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(244, 244, 246, 0.2)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollViewTransparent: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingRight: 16,
  },
  scrollContentTransparent: {
    backgroundColor: 'transparent',
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
