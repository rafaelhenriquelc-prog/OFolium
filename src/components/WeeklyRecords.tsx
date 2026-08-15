import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { useAppData } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';
import type { RecordType } from '@/data/types';
import { DEMO_TODAY, isWithinLastMonths } from '@/utils/competence';
import { mobileStackedCard } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

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

const MIN_HISTORY_DATE = '2026-06-01';
const HISTORY_MONTHS_BASE = 3;

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

function getMonthChunkStart(date: Date): Date {
  const chunkStartDay = Math.floor((date.getDate() - 1) / 7) * 7 + 1;
  return new Date(date.getFullYear(), date.getMonth(), chunkStartDay);
}

function formatDateRangeLabel(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_LABELS[start.getMonth()];
  const endMonth = MONTH_LABELS[end.getMonth()];

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} – ${endDay} de ${startMonth}`;
  }

  return `${startDay} de ${startMonth} – ${endDay} de ${endMonth}`;
}

function isDateAllowed(dateStr: string, isPro: boolean): boolean {
  if (dateStr > DEMO_TODAY) return false;
  if (isPro) return dateStr >= MIN_HISTORY_DATE;
  return isWithinLastMonths(dateStr.slice(0, 7), HISTORY_MONTHS_BASE) && dateStr >= MIN_HISTORY_DATE;
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

function isDateInWeek(dateStr: string, weekStart: Date): boolean {
  const date = parseDate(dateStr);
  const weekEnd = addDays(weekStart, 6);
  return date >= weekStart && date <= weekEnd;
}

function resolveSelectedDateForWeek(
  previousSelectedDate: string,
  weekStart: Date,
  weekDays: ReturnType<typeof buildWeekDays>,
  isPro: boolean,
): string {
  if (isDateInWeek(previousSelectedDate, weekStart) && isDateAllowed(previousSelectedDate, isPro)) {
    return previousSelectedDate;
  }

  if (isDateInWeek(DEMO_TODAY, weekStart) && isDateAllowed(DEMO_TODAY, isPro)) {
    return DEMO_TODAY;
  }

  const firstAllowedDay = weekDays.find((day) => isDateAllowed(day.dateStr, isPro));
  return firstAllowedDay?.dateStr ?? weekDays[0].dateStr;
}

export function WeeklyRecords() {
  const { getMovementsForDate } = useAppData();
  const { isPro } = usePlan();
  const { isMobile } = useResponsiveLayout();

  const initialWeekStart = useMemo(() => getMonthChunkStart(parseDate(DEMO_TODAY)), []);
  const [weekStartDate, setWeekStartDate] = useState(() => formatDateISO(initialWeekStart));
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const weekStart = parseDate(weekStartDate);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStartDate]);
  const weekEnd = addDays(weekStart, 6);
  const dateRangeLabel = formatDateRangeLabel(weekStart, weekEnd);

  const minAllowedDate = parseDate(MIN_HISTORY_DATE);
  const maxAllowedDate = parseDate(DEMO_TODAY);
  const previousWeekStart = addDays(weekStart, -7);
  const nextWeekStart = addDays(weekStart, 7);

  const canGoPrev = previousWeekStart >= minAllowedDate && isDateAllowed(formatDateISO(previousWeekStart), isPro);
  const canGoNext = nextWeekStart <= maxAllowedDate && isDateAllowed(formatDateISO(nextWeekStart), isPro);

  const dayMovements = getMovementsForDate(selectedDate);
  const selectedDayAllowed = isDateAllowed(selectedDate, isPro);

  const goToPreviousWeek = () => {
    if (!canGoPrev) return;
    const nextWeekStartDate = formatDateISO(previousWeekStart);
    const nextWeekDays = buildWeekDays(previousWeekStart);
    setWeekStartDate(nextWeekStartDate);
    setSelectedDate((current) =>
      resolveSelectedDateForWeek(current, previousWeekStart, nextWeekDays, isPro),
    );
  };

  const goToNextWeek = () => {
    if (!canGoNext) return;
    const nextWeekStartDate = formatDateISO(nextWeekStart);
    const nextWeekDays = buildWeekDays(nextWeekStart);
    setWeekStartDate(nextWeekStartDate);
    setSelectedDate((current) => resolveSelectedDateForWeek(current, nextWeekStart, nextWeekDays, isPro));
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
            !canGoPrev && styles.weekArrowDisabled,
            (pressed || hovered) && canGoPrev && styles.weekArrowActive,
          ]}
          onPress={goToPreviousWeek}
          disabled={!canGoPrev}
          accessibilityRole="button"
          accessibilityLabel="Semana anterior"
          accessibilityState={{ disabled: !canGoPrev }}>
          <Text style={[styles.weekArrowText, !canGoPrev && styles.weekArrowTextDisabled]}>‹</Text>
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
            !canGoNext && styles.weekArrowDisabled,
            (pressed || hovered) && canGoNext && styles.weekArrowActive,
          ]}
          onPress={goToNextWeek}
          disabled={!canGoNext}
          accessibilityRole="button"
          accessibilityLabel="Próxima semana"
          accessibilityState={{ disabled: !canGoNext }}>
          <Text style={[styles.weekArrowText, !canGoNext && styles.weekArrowTextDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.recordsList, isMobile && styles.recordsListMobile]}>
        {!selectedDayAllowed || dayMovements.length === 0 ? (
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
    flex: 2,
    minWidth: 320,
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: BrandColors.border,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardMobile: {
    ...mobileStackedCard,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 20,
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
    marginBottom: 24,
    paddingBottom: 16,
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
});
