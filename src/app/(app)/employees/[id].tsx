import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/mobile/Screen';

import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateInput } from '@/components/ui/DateInput';
import { Input } from '@/components/ui/Input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Modal } from '@/components/ui/Modal';
import { BrandColors } from '@/constants/colors';
import { ICON_SIZES, STAT_SYMBOLS, type StatIconType } from '@/constants/icons';
import { useAppData } from '@/contexts/AppDataContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { AbsenceSubtype, Movement, RecordType } from '@/data/types';
import { ESTIMATE_DISCLAIMER, formatMinutesAsHours, sumMovementsByType } from '@/utils/calculations';
import { competenceToLabel, CURRENT_COMPETENCE, getCompetenceFromDate } from '@/utils/competence';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatHireDate, getLocalTodayIso, parseDateInputToIso } from '@/utils/dateInput';
import { parseCurrencyInput } from '@/utils/masks';

type Tab = 'Resumo' | 'Registros' | 'Fechamentos';

const recordTypes: RecordType[] = ['Hora extra', 'Falta', 'Vale', 'Adicional', 'Desconto'];

const absenceSubtypes: AbsenceSubtype[] = [
  'Falta injustificada',
  'Falta justificada',
  'Atestado',
  'Atraso',
  'Saída antecipada',
];

const recordTypeColors: Record<RecordType, string> = {
  'Hora extra': BrandColors.orange,
  Falta: BrandColors.red,
  Vale: BrandColors.blue,
  Adicional: BrandColors.green,
  Desconto: BrandColors.red,
};

const SUMMARY_ICON_TYPES: Record<string, StatIconType> = {
  'Horas extras': 'overtime',
  Faltas: 'absences',
  Vales: 'vales',
  Adicionais: 'additions',
  'Previsão do mês': 'monthForecast',
};

const SUMMARY_ICON_BG = BrandColors.offWhite;
const SUMMARY_ICON_COLOR = BrandColors.graphite;

export default function EmployeeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getEmployeeById } = useEmployees();
  const { getMovementsForEmployee } = useAppData();
  const { isCompactLayout } = useResponsiveLayout();
  const employee = getEmployeeById(id ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('Resumo');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [recordFormType, setRecordFormType] = useState<RecordType | null>(null);

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
          <Text style={styles.metaValue}>{formatHireDate(employee.hireDate)}</Text>
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

      <RegisterModal
        visible={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSelectType={(type) => {
          setShowRegisterModal(false);
          setRecordFormType(type);
        }}
      />
      <RecordFormModal
        visible={recordFormType !== null}
        type={recordFormType}
        employeeId={employee.id}
        employeeName={employee.name}
        onClose={() => setRecordFormType(null)}
      />
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
      iconType: SUMMARY_ICON_TYPES['Horas extras'],
    },
    {
      label: 'Faltas',
      value: String(totals.absenceCount),
      iconType: SUMMARY_ICON_TYPES.Faltas,
    },
    {
      label: 'Vales',
      value: formatCurrency(summary?.vales ?? 0),
      iconType: SUMMARY_ICON_TYPES.Vales,
    },
    {
      label: 'Adicionais',
      value: formatCurrency(summary?.additions ?? 0),
      iconType: SUMMARY_ICON_TYPES.Adicionais,
    },
    {
      label: 'Previsão do mês',
      value: formatCurrency(summary?.forecast ?? 0),
      iconType: SUMMARY_ICON_TYPES['Previsão do mês'],
    },
  ];

  return (
    <View style={[styles.summaryGrid, compact && styles.summaryGridCompact]}>
      {cards.map((card) => (
        <Card key={card.label} style={[styles.summaryCard, compact && styles.summaryCardCompact]}>
          <View style={[styles.summaryIcon, { backgroundColor: SUMMARY_ICON_BG }]}>
            <AppIcon
              name={STAT_SYMBOLS[card.iconType]}
              size={compact ? ICON_SIZES.statCardCompact : ICON_SIZES.statCard}
              color={SUMMARY_ICON_COLOR}
            />
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

function RegisterModal({
  visible,
  onClose,
  onSelectType,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: RecordType) => void;
}) {
  return (
    <Modal title="Registrar" visible={visible} onClose={onClose}>
      <Text style={styles.registerSubtitle}>Selecione o tipo de registro:</Text>
      <View style={styles.registerOptions}>
        {recordTypes.map((type) => (
          <Pressable
            key={type}
            style={styles.registerOption}
            onPress={() => onSelectType(type)}>
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

function RecordFormModal({
  visible,
  type,
  employeeId,
  employeeName,
  onClose,
}: {
  visible: boolean;
  type: RecordType | null;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
}) {
  const { addMovement } = useAppData();
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [absenceSubtype, setAbsenceSubtype] = useState<AbsenceSubtype>('Falta injustificada');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOccurrenceDate('');
    setDuration('');
    setAmount('');
    setAbsenceSubtype('Falta injustificada');
    setNotes('');
    setFormError('');
    setIsSaving(false);
  }, [visible, type]);

  if (!type) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (isSaving) return;

    setFormError('');

    if (occurrenceDate.trim() && !parseDateInputToIso(occurrenceDate)) {
      setFormError('Informe uma data válida.');
      return;
    }

    const dateIso = parseDateInputToIso(occurrenceDate) ?? getLocalTodayIso();
    const parsedAmount = parseCurrencyInput(amount);
    let value = '';
    let movementAmount: number | undefined;

    switch (type) {
      case 'Hora extra':
        if (!duration.trim()) {
          setFormError('Informe a duração da hora extra.');
          return;
        }
        value = duration.trim();
        movementAmount = parsedAmount ?? undefined;
        break;
      case 'Falta':
        value = '1 dia';
        movementAmount = parsedAmount ?? undefined;
        break;
      case 'Vale':
      case 'Adicional':
      case 'Desconto':
        if (parsedAmount === null || parsedAmount <= 0) {
          setFormError('Informe um valor válido.');
          return;
        }
        movementAmount = parsedAmount;
        value = formatCurrency(parsedAmount);
        break;
    }

    const movement: Omit<Movement, 'id' | 'createdAt'> = {
      employeeId,
      employeeName,
      type,
      occurrenceDate: dateIso,
      competence: getCompetenceFromDate(dateIso),
      value,
      amount: movementAmount,
      notes: notes.trim() || undefined,
    };

    if (type === 'Falta') {
      movement.absenceSubtype = absenceSubtype;
      movement.estimatedDiscount =
        absenceSubtype === 'Falta injustificada' ||
        absenceSubtype === 'Atraso' ||
        absenceSubtype === 'Saída antecipada';
      if (movement.estimatedDiscount && movementAmount) {
        movement.formula = 'Salário-base ÷ 30';
      }
    }

    setIsSaving(true);

    try {
      const result = await addMovement(movement);

      if (!result.success) {
        setFormError(result.message);
        return;
      }

      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  const showCurrencyField = type === 'Vale' || type === 'Adicional' || type === 'Desconto';
  const showOptionalCurrencyField = type === 'Hora extra' || type === 'Falta';

  return (
    <Modal title={`Registrar ${type}`} visible={visible} onClose={handleClose}>
      <View style={styles.form}>
        <DateInput label="Data do registro" value={occurrenceDate} onChangeText={setOccurrenceDate} />

        {type === 'Hora extra' && (
          <Input
            label="Duração"
            placeholder="Ex: 2h30"
            value={duration}
            onChangeText={setDuration}
          />
        )}

        {type === 'Falta' && (
          <View style={styles.subtypeField}>
            <Text style={styles.subtypeLabel}>Tipo de falta</Text>
            <View style={styles.subtypeOptions}>
              {absenceSubtypes.map((subtype) => (
                <Pressable
                  key={subtype}
                  style={[
                    styles.subtypeOption,
                    absenceSubtype === subtype && styles.subtypeOptionActive,
                  ]}
                  onPress={() => setAbsenceSubtype(subtype)}>
                  <Text
                    style={[
                      styles.subtypeOptionText,
                      absenceSubtype === subtype && styles.subtypeOptionTextActive,
                    ]}>
                    {subtype}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {showCurrencyField && (
          <MaskedInput label="Valor" mask="currency" value={amount} onChangeText={setAmount} />
        )}

        {showOptionalCurrencyField && (
          <MaskedInput
            label="Valor estimado"
            optional
            mask="currency"
            value={amount}
            onChangeText={setAmount}
          />
        )}

        <Input
          label="Observações"
          optional
          placeholder="Detalhes adicionais"
          value={notes}
          onChangeText={setNotes}
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.modalActions}>
          <Button label="Cancelar" variant="outline" onPress={handleClose} disabled={isSaving} />
          <View style={styles.modalPrimary}>
            <Button
              label={isSaving ? 'Salvando...' : 'Salvar registro'}
              fullWidth
              disabled={isSaving}
              onPress={handleSave}
            />
          </View>
        </View>
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
  form: { gap: 14 },
  subtypeField: { gap: 8 },
  subtypeLabel: { fontSize: 13, fontWeight: '600', color: BrandColors.textPrimary },
  subtypeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subtypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
  },
  subtypeOptionActive: {
    backgroundColor: BrandColors.orangeLight,
    borderColor: 'rgba(255, 92, 0, 0.25)',
  },
  subtypeOptionText: { fontSize: 12, color: BrandColors.textSecondary, fontWeight: '500' },
  subtypeOptionTextActive: { color: BrandColors.orange, fontWeight: '600' },
  formError: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.red,
    marginTop: 4,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalPrimary: { flex: 1 },
});
