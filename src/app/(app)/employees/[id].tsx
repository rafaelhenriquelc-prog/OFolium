import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/mobile/Screen';

import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { BrandColors } from '@/constants/colors';
import { STAT_ICONS } from '@/constants/statIcons';
import { useAppData } from '@/contexts/AppDataContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { Movement, RecordType } from '@/data/types';
import { ESTIMATE_DISCLAIMER, formatMinutesAsHours, sumMovementsByType } from '@/utils/calculations';
import { competenceToLabel, CURRENT_COMPETENCE } from '@/utils/competence';
import { formatCurrency, formatDate } from '@/utils/format';

type Tab = 'Resumo' | 'Registros' | 'Fechamentos';

const recordTypes: RecordType[] = ['Hora extra', 'Falta', 'Vale', 'Adicional', 'Desconto'];

const recordTypeColors: Record<RecordType, string> = {
  'Hora extra': BrandColors.orange,
  Falta: BrandColors.red,
  Vale: BrandColors.blue,
  Adicional: BrandColors.green,
  Desconto: BrandColors.red,
};

const SUMMARY_ICONS = {
  'Horas extras': STAT_ICONS.horasExtras,
  Faltas: STAT_ICONS.faltas,
  Vales: STAT_ICONS.vales,
  Adicionais: STAT_ICONS.adicionais,
  'Previsão do mês': STAT_ICONS.previsaoDoMes,
} as const;

export default function EmployeeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getEmployeeById } = useEmployees();
  const { getMovementsForEmployee } = useAppData();
  const { isCompactLayout } = useResponsiveLayout();
  const employee = getEmployeeById(id ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('Resumo');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  if (!employee) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Funcionário não encontrado.</Text>
        <Pressable onPress={() => router.push('/employees' as Href)}>
          <Text style={styles.backLink}>← Voltar para funcionários</Text>
        </Pressable>
      </View>
    );
  }

  const records = getMovementsForEmployee(employee.id);

  return (
    <Screen>
      <Pressable style={styles.backButton} onPress={() => router.push('/employees' as Href)}>
        <Text style={styles.backLink}>← Funcionários</Text>
      </Pressable>

      <View style={[styles.profileHeader, isCompactLayout && styles.profileHeaderCompact]}>
        <View style={[styles.avatar, isCompactLayout && styles.avatarCompact, { backgroundColor: `${employee.avatarColor}18` }]}>
          <Text style={[styles.avatarText, { color: employee.avatarColor }]}>
            {employee.initials}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{employee.name}</Text>
          <Text style={styles.role}>{employee.role}</Text>
          <Badge label={employee.status} variant={getStatusVariant(employee.status)} />
        </View>
        <View style={[styles.profileMeta, isCompactLayout && styles.profileMetaCompact]}>
          <Text style={styles.metaLabel}>Salário base</Text>
          <Text style={styles.metaValue}>{formatCurrency(employee.baseSalary)}</Text>
          <Text style={styles.metaLabel}>Admissão</Text>
          <Text style={styles.metaValue}>{formatDate(employee.hireDate)}</Text>
        </View>
        <Button label="+ Registrar" onPress={() => setShowRegisterModal(true)} fullWidth={isCompactLayout} />
      </View>

      <ScrollView horizontal={isCompactLayout} showsHorizontalScrollIndicator={false} style={isCompactLayout ? styles.tabsScroll : undefined}>
        <View style={[styles.tabs, isCompactLayout && styles.tabsCompact]}>
        {(['Resumo', 'Registros', 'Fechamentos'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
        </View>
      </ScrollView>

      {activeTab === 'Resumo' && <SummaryTab employeeId={employee.id} compact={isCompactLayout} />}
      {activeTab === 'Registros' && <RecordsTab records={records} />}
      {activeTab === 'Fechamentos' && (
        <ClosingsTab employeeId={employee.id} employeeName={employee.name} />
      )}

      <RegisterModal visible={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </Screen>
  );
}

function SummaryTab({ employeeId, compact }: { employeeId: string; compact?: boolean }) {
  const { getMovementsForEmployee, getEmployeeSummary } = useAppData();
  const movements = getMovementsForEmployee(employeeId, CURRENT_COMPETENCE);
  const summary = getEmployeeSummary(employeeId, CURRENT_COMPETENCE);
  const totals = sumMovementsByType(movements);

  const cards = [
    {
      label: 'Horas extras',
      value: formatMinutesAsHours(totals.overtimeMinutes),
      bg: BrandColors.amberLight,
      icon: SUMMARY_ICONS['Horas extras'],
    },
    {
      label: 'Faltas',
      value: String(totals.absenceCount),
      bg: BrandColors.redLight,
      icon: SUMMARY_ICONS.Faltas,
    },
    {
      label: 'Vales',
      value: formatCurrency(summary?.vales ?? 0),
      bg: BrandColors.blueLight,
      icon: SUMMARY_ICONS.Vales,
    },
    {
      label: 'Adicionais',
      value: formatCurrency(summary?.additions ?? 0),
      bg: BrandColors.greenLight,
      icon: SUMMARY_ICONS.Adicionais,
    },
    {
      label: 'Previsão do mês',
      value: formatCurrency(summary?.forecast ?? 0),
      bg: BrandColors.orangeLight,
      icon: SUMMARY_ICONS['Previsão do mês'],
    },
  ];

  return (
    <View style={[styles.summaryGrid, compact && styles.summaryGridCompact]}>
      {cards.map((card) => (
        <Card key={card.label} style={[styles.summaryCard, compact && styles.summaryCardCompact]}>
          <View style={[styles.summaryIcon, { backgroundColor: card.bg }]}>
            <Image source={card.icon} style={styles.summaryIconImage} contentFit="contain" />
          </View>
          <Text style={styles.summaryLabel}>{card.label}</Text>
          <Text style={styles.summaryValue}>{card.value}</Text>
        </Card>
      ))}
      <Text style={styles.estimateNotice}>{ESTIMATE_DISCLAIMER}</Text>
    </View>
  );
}

function RecordsTab({ records }: { records: Movement[] }) {
  return (
    <Card>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
      ) : (
        records.map((record, index) => (
          <View
            key={record.id}
            style={[styles.recordRow, index < records.length - 1 && styles.recordRowBorder]}>
            <View
              style={[
                styles.recordTag,
                { backgroundColor: `${recordTypeColors[record.type]}18` },
              ]}>
              <Text style={[styles.recordTagText, { color: recordTypeColors[record.type] }]}>
                {record.type}
              </Text>
            </View>
            <Text style={styles.recordValue}>{record.value}</Text>
            <Text style={styles.recordDate}>{formatDate(record.occurrenceDate)}</Text>
          </View>
        ))
      )}
    </Card>
  );
}

function ClosingsTab({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const { getEmployeeSummary } = useAppData();
  const summary = getEmployeeSummary(employeeId, CURRENT_COMPETENCE);

  if (!summary) {
    return (
      <Card>
        <Text style={styles.emptyText}>Nenhum fechamento disponível para este funcionário.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.closingTitle}>Fechamento — {competenceToLabel(CURRENT_COMPETENCE)}</Text>
      <View style={styles.closingBreakdown}>
        <ClosingLine label="Salário base" value={formatCurrency(summary.baseSalary)} />
        <ClosingLine label="+ Horas extras" value={formatCurrency(summary.extras)} positive />
        <ClosingLine label="+ Adicionais" value={formatCurrency(summary.additions)} positive />
        <ClosingLine label="− Vales" value={formatCurrency(summary.vales)} negative />
        <ClosingLine label="− Faltas/descontos" value={formatCurrency(summary.discounts)} negative />
        <View style={styles.closingDivider} />
        <ClosingLine label="= Valor previsto" value={formatCurrency(summary.forecast)} total />
      </View>
      <Badge label={summary.reviewStatus} variant={getStatusVariant(summary.reviewStatus)} />
      <Text style={styles.closingNote}>Fechamento de {employeeName}</Text>
      <Text style={styles.estimateNotice}>{ESTIMATE_DISCLAIMER}</Text>
    </Card>
  );
}

function ClosingLine({
  label,
  value,
  positive,
  negative,
  total,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  total?: boolean;
}) {
  return (
    <View style={styles.closingLine}>
      <Text style={[styles.closingLabel, total && styles.closingLabelTotal]}>{label}</Text>
      <Text
        style={[
          styles.closingValue,
          positive && { color: BrandColors.green },
          negative && { color: BrandColors.red },
          total && styles.closingValueTotal,
        ]}>
        {value}
      </Text>
    </View>
  );
}

function RegisterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal title="Registrar" visible={visible} onClose={onClose}>
      <Text style={styles.registerSubtitle}>Selecione o tipo de registro:</Text>
      <View style={styles.registerOptions}>
        {recordTypes.map((type) => (
          <Pressable
            key={type}
            style={styles.registerOption}
            onPress={onClose}>
            <View
              style={[
                styles.registerOptionDot,
                { backgroundColor: recordTypeColors[type] },
              ]}
            />
            <Text style={styles.registerOptionText}>{type}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  notFoundText: { fontSize: 16, color: BrandColors.textSecondary },
  backButton: { marginBottom: 16 },
  backLink: { fontSize: 14, fontWeight: '600', color: BrandColors.orange },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  profileHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignSelf: 'flex-start',
  },
  avatarText: { fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 6, minWidth: 160 },
  name: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary },
  role: { fontSize: 14, color: BrandColors.textSecondary },
  profileMeta: { gap: 4 },
  profileMetaCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaLabel: { fontSize: 12, color: BrandColors.textMuted },
  metaValue: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary, marginBottom: 8 },
  tabsScroll: { marginBottom: 16 },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    paddingBottom: 0,
  },
  tabsCompact: {
    marginBottom: 0,
    paddingRight: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: BrandColors.orange },
  tabText: { fontSize: 14, fontWeight: '500', color: BrandColors.textSecondary },
  tabTextActive: { color: BrandColors.orange, fontWeight: '600' },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryGridCompact: {
    flexDirection: 'column',
  },
  summaryCard: { flex: 1, minWidth: 160, gap: 8 },
  summaryCardCompact: { minWidth: 0, width: '100%', flex: 0 },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconImage: {
    width: 20,
    height: 20,
  },
  summaryLabel: { fontSize: 13, color: BrandColors.textSecondary },
  summaryValue: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary },
  emptyText: { fontSize: 14, color: BrandColors.textMuted, textAlign: 'center', padding: 24 },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  recordRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  recordTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  recordTagText: { fontSize: 12, fontWeight: '600' },
  recordValue: { flex: 1, fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  recordDate: { fontSize: 13, color: BrandColors.textMuted },
  closingTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.textPrimary, marginBottom: 16 },
  closingBreakdown: { gap: 10, marginBottom: 16 },
  closingLine: { flexDirection: 'row', justifyContent: 'space-between' },
  closingLabel: { fontSize: 14, color: BrandColors.textSecondary },
  closingLabelTotal: { fontWeight: '700', color: BrandColors.textPrimary },
  closingValue: { fontSize: 14, color: BrandColors.textPrimary, fontWeight: '500' },
  closingValueTotal: { fontSize: 16, fontWeight: '700', color: BrandColors.orange },
  closingDivider: { height: 1, backgroundColor: BrandColors.border, marginVertical: 8 },
  closingNote: { fontSize: 12, color: BrandColors.textMuted, marginTop: 12 },
  estimateNotice: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textMuted,
    marginTop: 12,
  },
  registerSubtitle: { fontSize: 14, color: BrandColors.textSecondary, marginBottom: 12 },
  registerOptions: { gap: 8 },
  registerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.offWhite,
  },
  registerOptionDot: { width: 10, height: 10, borderRadius: 5 },
  registerOptionText: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
});
