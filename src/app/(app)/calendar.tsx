import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/mobile/Screen';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandColors } from '@/constants/colors';
import { MIN_TOUCH_TARGET } from '@/constants/layout';
import { useAppData } from '@/contexts/AppDataContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { Movement, RecordType } from '@/data/types';
import { DEMO_TODAY } from '@/utils/competence';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const typeColors: Record<RecordType, string> = {
  'Hora extra': BrandColors.orange,
  Falta: BrandColors.red,
  Vale: BrandColors.blue,
  Adicional: BrandColors.green,
  Desconto: BrandColors.red,
};

const legend: { type: RecordType; color: string }[] = [
  { type: 'Hora extra', color: BrandColors.orange },
  { type: 'Falta', color: BrandColors.red },
  { type: 'Vale', color: BrandColors.blue },
  { type: 'Adicional', color: BrandColors.green },
  { type: 'Desconto', color: BrandColors.red },
];

export default function CalendarScreen() {
  const { movements, getMovementsForDate } = useAppData();
  const { isMobile } = useResponsiveLayout();
  const [month, setMonth] = useState(7);
  const [year] = useState(2026);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const recordsByDate = useMemo(() => {
    const map = new Map<string, Movement[]>();
    movements.forEach((record) => {
      const existing = map.get(record.occurrenceDate) ?? [];
      map.set(record.occurrenceDate, [...existing, record]);
    });
    return map;
  }, [movements]);

  const selectedRecords = selectedDate ? getMovementsForDate(selectedDate) : [];
  const todayDay = Number.parseInt(DEMO_TODAY.split('-')[2] ?? '14', 10);

  const prevMonth = () => setMonth((m) => (m === 0 ? 11 : m - 1));
  const nextMonth = () => setMonth((m) => (m === 11 ? 0 : m + 1));

  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Screen>
      <PageHeader title="Calendário" subtitle="Visualize os registros da equipe por dia." />

      <Card>
        <View style={styles.monthSelector}>
          <Pressable onPress={prevMonth} style={[styles.monthArrow, isMobile && styles.monthArrowMobile]}>
            <Text style={styles.monthArrowText}>‹</Text>
          </Pressable>
          <Text style={[styles.monthLabel, isMobile && styles.monthLabelMobile]}>
            {MONTHS[month]} de {year}
          </Text>
          <Pressable onPress={nextMonth} style={[styles.monthArrow, isMobile && styles.monthArrowMobile]}>
            <Text style={styles.monthArrowText}>›</Text>
          </Pressable>
        </View>

        <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false} style={isMobile ? styles.legendScroll : undefined}>
          <View style={[styles.legend, isMobile && styles.legendMobile]}>
            {legend.map((item) => (
              <View key={item.type} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.type}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <Text key={day} style={styles.weekdayLabel}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayRecords = recordsByDate.get(dateStr) ?? [];
            const isToday = day === todayDay && month === 7;

            return (
              <Pressable
                key={dateStr}
                style={[styles.dayCell, isMobile && styles.dayCellMobile, isToday && styles.dayCellToday]}
                onPress={() => setSelectedDate(dateStr)}>
                <Text style={[styles.dayNumber, isMobile && styles.dayNumberMobile, isToday && styles.dayNumberToday]}>{day}</Text>
                <View style={styles.dayIndicators}>
                  {dayRecords.slice(0, 3).map((record) => (
                    <View
                      key={record.id}
                      style={[styles.indicator, { backgroundColor: typeColors[record.type] }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <DayRecordsModal
        visible={!!selectedDate}
        date={selectedDate}
        records={selectedRecords}
        onClose={() => setSelectedDate(null)}
      />
    </Screen>
  );
}

function DayRecordsModal({
  visible,
  date,
  records,
  onClose,
}: {
  visible: boolean;
  date: string | null;
  records: Movement[];
  onClose: () => void;
}) {
  if (!date) return null;

  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Modal title={formatted} visible={visible} onClose={onClose}>
      {records.length === 0 ? (
        <Text style={styles.noRecords}>Nenhum registro neste dia.</Text>
      ) : (
        records.map((record, index) => (
          <View
            key={record.id}
            style={[styles.recordItem, index < records.length - 1 && styles.recordItemBorder]}>
            <View style={[styles.recordDot, { backgroundColor: typeColors[record.type] }]} />
            <View style={styles.recordInfo}>
              <Text style={styles.recordType}>{record.type}</Text>
              <Text style={styles.recordEmployee}>{record.employeeName}</Text>
              {record.notes ? <Text style={styles.recordNotes}>{record.notes}</Text> : null}
            </View>
            <Text style={styles.recordValue}>{record.value}</Text>
          </View>
        ))
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BrandColors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowMobile: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  monthArrowText: { fontSize: 22, color: BrandColors.textSecondary, fontWeight: '300' },
  monthLabel: { fontSize: 18, fontWeight: '700', color: BrandColors.textPrimary },
  monthLabelMobile: { fontSize: 16 },
  legendScroll: { marginBottom: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  legendMobile: { flexWrap: 'nowrap', gap: 12, paddingRight: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: BrandColors.textSecondary },
  weekdayRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
    textTransform: 'uppercase',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 8,
    gap: 4,
  },
  dayCellMobile: {
    minHeight: 44,
  },
  dayCellToday: { backgroundColor: BrandColors.orangeLight },
  dayNumber: { fontSize: 14, fontWeight: '500', color: BrandColors.textPrimary },
  dayNumberMobile: { fontSize: 13 },
  dayNumberToday: { color: BrandColors.orange, fontWeight: '700' },
  dayIndicators: { flexDirection: 'row', gap: 3, height: 6 },
  indicator: { width: 6, height: 6, borderRadius: 3 },
  noRecords: { fontSize: 14, color: BrandColors.textMuted, textAlign: 'center', padding: 16 },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  recordItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  recordDot: { width: 10, height: 10, borderRadius: 5 },
  recordInfo: { flex: 1 },
  recordType: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  recordEmployee: { fontSize: 12, color: BrandColors.textSecondary },
  recordNotes: { fontSize: 12, color: BrandColors.textMuted, marginTop: 2 },
  recordValue: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
});
