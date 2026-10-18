import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { mobileStackedCard } from '@/constants/layout';
import { useAppData } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';
import type { RecordType } from '@/data/types';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getCalendarCompetence, isDateWithinPlanHistory } from '@/utils/competence';

const typeStyles: Record<RecordType, { label: string; color: string; bg: string }> = {
  'Hora extra': { label: 'Hora extra', color: BrandColors.orange, bg: BrandColors.orangeLight },
  Falta: { label: 'Falta', color: BrandColors.red, bg: BrandColors.redLight },
  Vale: { label: 'Vale', color: BrandColors.blue, bg: BrandColors.blueLight },
  Adicional: { label: 'Adicional', color: BrandColors.green, bg: BrandColors.greenLight },
  Desconto: { label: 'Desconto', color: BrandColors.red, bg: BrandColors.redLight },
};

const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTH_LABELS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const BASE_HISTORY_MESSAGE = 'O plano Base consulta o histórico dos últimos 3 meses.';

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function anchorDateForCompetence(competence: string): Date {
  const today = new Date();
  if (competence === getCalendarCompetence(today)) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  return parseDate(`${competence}-01`);
}

function formatDateRangeLabel(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_LABELS[start.getMonth()];
  const endMonth = MONTH_LABELS[end.getMonth()];
  const currentYear = new Date().getFullYear();
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    const year = start.getFullYear() !== currentYear ? ` de ${start.getFullYear()}` : '';
    return `${startDay} – ${endDay} de ${startMonth}${year}`;
  }

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startDay} de ${startMonth} de ${start.getFullYear()} – ${endDay} de ${endMonth} de ${end.getFullYear()}`;
  }

  const year = start.getFullYear() !== currentYear ? ` de ${start.getFullYear()}` : '';
  return `${startDay} de ${startMonth} – ${endDay} de ${endMonth}${year}`;
}

function isDateAllowed(dateStr: string, isPro: boolean): boolean {
  return isDateWithinPlanHistory(dateStr, isPro);
}

function buildWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dateStr: formatDateISO(date),
      dayNumber: String(date.getDate()),
      weekday: WEEKDAY_LABELS[date.getDay()],
    };
  });
}

function resolveSelectedDate(weekStart: Date, isPro: boolean, preferred?: string): string {
  const weekDays = buildWeekDays(weekStart);
  const today = formatDateISO(new Date());
  const candidates = [preferred, today].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (weekDays.some((day) => day.dateStr === candidate) && isDateAllowed(candidate, isPro)) {
      return candidate;
    }
  }

  return weekDays.find((day) => isDateAllowed(day.dateStr, isPro))?.dateStr ?? weekDays[0].dateStr;
}

function weekHasAllowedDay(weekStart: Date, isPro: boolean): boolean {
  return buildWeekDays(weekStart).some((day) => isDateAllowed(day.dateStr, isPro));
}

export function WeeklyRecords({ competence }: { competence: string }) {
  const { getMovementsForDate } = useAppData();
  const { isPro } = usePlan();
  const { isMobile } = useResponsiveLayout();

  const [weekStartDate, setWeekStartDate] = useState(() =>
    formatDateISO(startOfWeek(anchorDateForCompetence(competence))),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    resolveSelectedDate(startOfWeek(anchorDateForCompetence(competence)), isPro),
  );
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [historyLimitReached, setHistoryLimitReached] = useState(false);

  useEffect(() => {
    const weekStart = startOfWeek(anchorDateForCompetence(competence));
    setWeekStartDate(formatDateISO(weekStart));
    setSelectedDate(resolveSelectedDate(weekStart, isPro));
    setHistoryLimitReached(false);
  }, [competence, isPro]);

  const weekStart = parseDate(weekStartDate);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStartDate]);
  const weekEnd = addDays(weekStart, 6);
  const dateRangeLabel = formatDateRangeLabel(weekStart, weekEnd);

  const previousWeekStart = addDays(weekStart, -7);
  const nextWeekStart = addDays(weekStart, 7);

  const dayMovements = getMovementsForDate(selectedDate);
  const selectedDayAllowed = isDateAllowed(selectedDate, isPro);

  const moveToWeek = (targetStart: Date) => {
    const targetDays = buildWeekDays(targetStart);
    const selectedIndex = Math.max(
      0,
      weekDays.findIndex((day) => day.dateStr === selectedDate),
    );
    const sameWeekday = targetDays[selectedIndex]?.dateStr;
    setWeekStartDate(formatDateISO(targetStart));
    setSelectedDate(resolveSelectedDate(targetStart, isPro, sameWeekday));
    setHistoryLimitReached(false);
  };

  const goToPreviousWeek = () => {
    if (!weekHasAllowedDay(previousWeekStart, isPro)) {
      setHistoryLimitReached(true);
      return;
    }
    moveToWeek(previousWeekStart);
  };

  const goToNextWeek = () => {
    moveToWeek(nextWeekStart);
  };

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Registros da semana</Text>
        <Text style={styles.dateRange}>{dateRangeLabel}</Text>
      </View>

      <View style={[styles.weekNav, isMobile && styles.weekNavMobile]}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.weekArrow,
            isMobile && styles.weekArrowMobile,
            (pressed || hovered) && styles.weekArrowActive,
          ]}
          onPress={goToPreviousWeek}
          accessibilityRole="button"
          accessibilityLabel="Semana anterior">
          <Text style={styles.weekArrowText}>‹</Text>
        </Pressable>

        <View style={[styles.weekDays, isMobile && styles.weekDaysMobile]}>
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const isDisabled = !isDateAllowed(day.dateStr, isPro);

            return (
              <Pressable
                key={day.dateStr}
                style={({ pressed, hovered }) => [
                  styles.dayColumn,
                  isMobile && styles.dayColumnMobile,
                  isDisabled && styles.dayColumnDisabled,
                  (pressed || hovered) && !isDisabled && styles.dayColumnActive,
                  focusedDate === day.dateStr && styles.dayColumnFocused,
                ]}
                onPress={() => {
                  if (isDisabled) return;
                  setSelectedDate(day.dateStr);
                }}
                onFocus={() => setFocusedDate(day.dateStr)}
                onBlur={() => setFocusedDate((current) => (current === day.dateStr ? null : current))}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityLabel={`${day.dayNumber}, ${day.weekday}`}
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}>
                <View style={[styles.dayCircle, isMobile && styles.dayCircleMobile, isSelected && styles.dayCircleActive]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      isMobile && styles.dayNumberMobile,
                      isSelected && styles.dayNumberActive,
                    ]}>
                    {day.dayNumber}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    isMobile && styles.dayLabelMobile,
                    isSelected && styles.dayLabelActive,
                  ]}
                  numberOfLines={1}>
                  {day.weekday}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed, hovered }) => [
            styles.weekArrow,
            isMobile && styles.weekArrowMobile,
            (pressed || hovered) && styles.weekArrowActive,
          ]}
          onPress={goToNextWeek}
          accessibilityRole="button"
          accessibilityLabel="Próxima semana">
          <Text style={styles.weekArrowText}>›</Text>
        </Pressable>
      </View>

      {historyLimitReached ? <Text style={styles.limitText}>{BASE_HISTORY_MESSAGE}</Text> : null}

      <View style={[styles.recordsList, isMobile && styles.recordsListMobile]}>
        {!selectedDayAllowed ? (
          <Text style={styles.emptyText}>{BASE_HISTORY_MESSAGE}</Text>
        ) : dayMovements.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum registro neste dia.</Text>
        ) : (
          dayMovements.map((record) => {
            const tag = typeStyles[record.type];
            return (
              <View key={record.id} style={styles.recordItem}>
                <Text style={styles.recordName}>{record.employeeName}</Text>
                <View style={styles.recordRight}>
                  <View style={[styles.tag, { backgroundColor: tag.bg }]}>
                    <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
                  </View>
                  {record.value ? <Text style={styles.recordValue}>{record.value}</Text> : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardMobile: {
    ...mobileStackedCard,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 14,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  dateRange: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  weekNavMobile: {
    gap: 4,
    marginBottom: 16,
  },
  weekArrow: {
    width: 28,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.offWhite,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  weekArrowMobile: {
    width: 24,
    height: 32,
    minWidth: 24,
  },
  weekArrowDisabled: {
    opacity: 0.45,
  },
  weekArrowActive: {
    opacity: 0.85,
    backgroundColor: BrandColors.orangeLight,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 2,
          outlineColor: BrandColors.orange,
          outlineStyle: 'solid' as const,
          outlineOffset: 2,
        }
      : {}),
  },
  weekArrowText: {
    fontSize: 20,
    fontWeight: '300',
    color: BrandColors.textSecondary,
    lineHeight: 22,
  },
  weekArrowTextDisabled: {
    color: BrandColors.textMuted,
  },
  weekDays: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  weekDaysMobile: {
    flex: 1,
    minWidth: 0,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
    flexShrink: 0,
    borderRadius: 8,
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  dayColumnMobile: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  dayColumnActive: {
    opacity: 0.92,
  },
  dayColumnDisabled: {
    opacity: 0.35,
  },
  dayColumnFocused: {
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 2,
          outlineColor: BrandColors.orange,
          outlineStyle: 'solid' as const,
          outlineOffset: 2,
        }
      : {}),
  },
  dayCircleMobile: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dayNumberMobile: {
    fontSize: 12,
  },
  dayLabelMobile: {
    fontSize: 9,
    letterSpacing: 0,
  },
  recordsListMobile: {
    minHeight: undefined,
    paddingTop: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: BrandColors.orange,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  dayNumberActive: {
    color: BrandColors.white,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: BrandColors.textMuted,
    letterSpacing: 0.3,
  },
  dayLabelActive: {
    color: BrandColors.orange,
  },
  recordsList: {
    gap: 12,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordName: {
    fontSize: 13,
    fontWeight: '500',
    color: BrandColors.textPrimary,
    flex: 1,
    flexShrink: 1,
    minWidth: 100,
  },
  recordRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    flexShrink: 0,
  },
  emptyText: {
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  limitText: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textSecondary,
    marginBottom: 10,
  },
});
