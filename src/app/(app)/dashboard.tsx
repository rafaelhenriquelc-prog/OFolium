import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { FadeSlideIn } from '@/components/animation/FadeSlideIn';
import { Header } from '@/components/Header';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { StatCardsRow } from '@/components/StatCard';
import { WeeklyRecords } from '@/components/WeeklyRecords';
import { useAppShellUI } from '@/contexts/AppShellUIContext';
import { useAppData } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { mobilePageContain } from '@/constants/layout';
import {
  addMonthsToCompetence,
  competenceIndex,
  competenceToLabel,
  getCalendarCompetence,
  isCompetenceInBaseHistory,
} from '@/utils/competence';

const BASE_HISTORY_MESSAGE = 'O plano Base consulta o histórico dos últimos 3 meses.';

const DASHBOARD_HEADER_DURATION = 400;
const DASHBOARD_HEADER_OFFSET = 8;
const DASHBOARD_STAT_BASE_DELAY = 100;
const DASHBOARD_STAT_STAGGER = 60;
const DASHBOARD_STAT_DURATION = 400;
const DASHBOARD_STAT_OFFSET = 10;
const DASHBOARD_SECTION_DURATION = 400;
const DASHBOARD_SECTION_OFFSET = 8;
const DASHBOARD_MIDDLE_DELAY = 380;

export default function DashboardScreen() {
  const { ProFeatureModalHost } = useAppData();
  const { consumeDashboardEntryAnimation } = useAppShellUI();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimateEntry = useRef(consumeDashboardEntryAnimation()).current;
  const animateEntry = shouldAnimateEntry && !prefersReducedMotion;
  const { isPro } = usePlan();
  const { isMobile, isCompactLayout, contentPaddingHorizontal, contentPaddingBottom } =
    useResponsiveLayout();
  const isCompact = isCompactLayout;
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedCompetence, setSelectedCompetence] = useState(() => getCalendarCompetence());
  const [competenceNotice, setCompetenceNotice] = useState<string | null>(null);
  const calendarCompetence = getCalendarCompetence();
  const canAdvanceCompetence = competenceIndex(selectedCompetence) < competenceIndex(calendarCompetence);

  const selectPreviousCompetence = () => {
    const previous = addMonthsToCompetence(selectedCompetence, -1);
    if (!isPro && !isCompetenceInBaseHistory(previous, calendarCompetence)) {
      setCompetenceNotice(BASE_HISTORY_MESSAGE);
      return;
    }
    setCompetenceNotice(null);
    setSelectedCompetence(previous);
  };

  const selectNextCompetence = () => {
    if (!canAdvanceCompetence) return;
    setCompetenceNotice(null);
    setSelectedCompetence(addMonthsToCompetence(selectedCompetence, 1));
  };

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
        <FadeSlideIn
          duration={DASHBOARD_HEADER_DURATION}
          translateY={DASHBOARD_HEADER_OFFSET}
          enabled={animateEntry}
          style={styles.headerLayer}>
          <Header
            onNotificationPress={toggleNotificationsPanel}
            isNotificationsPanelOpen={isNotificationsPanelOpen}
            employeeQuery={employeeQuery}
            onEmployeeQueryChange={setEmployeeQuery}
            competenceLabel={competenceToLabel(selectedCompetence)}
            onPreviousCompetence={selectPreviousCompetence}
            onNextCompetence={selectNextCompetence}
            canAdvanceCompetence={canAdvanceCompetence}
            competenceNotice={competenceNotice}
          />
        </FadeSlideIn>
        <StatCardsRow
          competence={selectedCompetence}
          entryAnimation={
            animateEntry
              ? {
                  baseDelay: DASHBOARD_STAT_BASE_DELAY,
                  stagger: DASHBOARD_STAT_STAGGER,
                  duration: DASHBOARD_STAT_DURATION,
                  translateY: DASHBOARD_STAT_OFFSET,
                }
              : undefined
          }
        />

        <FadeSlideIn
          delay={DASHBOARD_MIDDLE_DELAY}
          duration={DASHBOARD_SECTION_DURATION}
          translateY={DASHBOARD_SECTION_OFFSET}
          enabled={animateEntry}>
          <WeeklyRecords competence={selectedCompetence} />
        </FadeSlideIn>
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
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingRight: 16,
    backgroundColor: 'transparent',
  },
  headerLayer: {
    zIndex: 20,
    position: 'relative',
  },
});
