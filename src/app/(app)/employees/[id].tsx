import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { Toast } from '@/components/ui/Toast';
import { BrandColors } from '@/constants/colors';
import { STAT_SYMBOLS, type AppSymbolName, type StatIconType } from '@/constants/icons';
import { useAppData } from '@/contexts/AppDataContext';
import { EMPLOYEE_LINKED_HISTORY_MESSAGE, useEmployees } from '@/contexts/EmployeesContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { AbsenceSubtype, Employee, Movement, RecordType } from '@/data/types';
import { ESTIMATE_DISCLAIMER, formatMinutesAsHours, sumMovementsByType } from '@/utils/calculations';
import { competenceToLabel, CURRENT_COMPETENCE, DEMO_TODAY, getCalendarCompetence, getCompetenceFromDate } from '@/utils/competence';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatHireDate, getLocalTodayIso, isoToDateInput, parseDateInputToIso, validateHireDateInput } from '@/utils/dateInput';
import { isEmployeeActive } from '@/utils/employee';
import { valueToDecimalHours } from '@/utils/activityFromMovements';
import { parseCurrencyInput } from '@/utils/masks';
import { isValidEmail } from '@/utils/validation';

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
const SUMMARY_ICON_COLOR = BrandColors.orange;

const RECORD_SUCCESS_MESSAGE: Record<RecordType, string> = {
  'Hora extra': 'Hora extra registrada com sucesso!',
  Falta: 'Falta registrada com sucesso!',
  Vale: 'Vale registrado com sucesso!',
  Adicional: 'Adicional registrado com sucesso!',
  Desconto: 'Desconto registrado com sucesso!',
};

export default function EmployeeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getEmployeeById,
    updateEmployeeDetails,
    deactivateEmployee,
    reactivateEmployee,
    removeEmployee,
    countEmployeeMovements,
    isDemoMode,
  } = useEmployees();
  const { getMovementsForEmployee, hasEmployeeFinancialRecords, movements } = useAppData();
  const { isCompactLayout } = useResponsiveLayout();
  const employeeId = typeof id === 'string' ? id : '';
  const employee = getEmployeeById(employeeId);
  const [activeTab, setActiveTab] = useState<Tab>('Resumo');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [profileCompetence, setProfileCompetence] = useState(getCalendarCompetence);
  const competencePinnedRef = useRef(false);
  const [persistedMovementCount, setPersistedMovementCount] = useState<number | null>(null);
  const [historyCheckState, setHistoryCheckState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (isDemoMode || !employeeId) {
      setPersistedMovementCount(null);
      setHistoryCheckState('idle');
      return;
    }

    let cancelled = false;
    setHistoryCheckState('loading');

    void countEmployeeMovements(employeeId).then((result) => {
      if (cancelled) return;
      if (result.count === null) {
        setPersistedMovementCount(null);
        setHistoryCheckState('error');
        return;
      }
      setPersistedMovementCount(result.count);
      setHistoryCheckState('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [countEmployeeMovements, employeeId, isDemoMode]);

  useEffect(() => {
    competencePinnedRef.current = false;
  }, [employeeId]);

  useEffect(() => {
    if (competencePinnedRef.current) return;

    if (isDemoMode) {
      setProfileCompetence(CURRENT_COMPETENCE);
      return;
    }

    const latestCompetence = movements.reduce<string | null>((latest, movement) => {
      if (movement.employeeId !== employeeId) return latest;
      if (!latest || movement.competence > latest) return movement.competence;
      return latest;
    }, null);

    setProfileCompetence(latestCompetence ?? getCalendarCompetence());
  }, [employeeId, isDemoMode, movements]);

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

  const hasLocalFinancialHistory = hasEmployeeFinancialRecords(employee.id);
  const hasLinkedFinancialHistory = hasLocalFinancialHistory || (persistedMovementCount ?? 0) > 0;
  const canRemove = isDemoMode
    ? !hasLocalFinancialHistory
    : historyCheckState === 'ready' && persistedMovementCount === 0 && !hasLocalFinancialHistory;
  const removalNote = hasLinkedFinancialHistory
    ? EMPLOYEE_LINKED_HISTORY_MESSAGE
    : canRemove
      ? null
      : !isDemoMode && historyCheckState === 'error'
        ? 'Não foi possível confirmar o histórico financeiro. A remoção permanece bloqueada.'
        : !isDemoMode
          ? 'Verificando registros financeiros...'
          : null;
  const employeeIsActive = isEmployeeActive(employee.status);

  return (
    <Screen>
      <Pressable style={styles.backButton} onPress={() => router.push('/employees' as Href)}>
        <Text style={styles.backLink}>← Funcionários</Text>
      </Pressable>

      <View style={[styles.profileHeader, isCompactLayout && styles.profileHeaderCompact]}>
        <View style={styles.identity}>
          <View style={[styles.avatar, isCompactLayout && styles.avatarCompact, { backgroundColor: `${employee.avatarColor}18` }]}>
            <Text style={[styles.avatarText, { color: employee.avatarColor }]}>
              {employee.initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={2}>
                {employee.name}
              </Text>
              <Pressable
                onPress={() => {
                  setFeedbackMessage(null);
                  setShowEditModal(true);
                }}
                style={styles.nameEditButton}
                accessibilityRole="button"
                accessibilityLabel="Editar funcionário"
                {...{ title: 'Editar funcionário' }}
                hitSlop={8}>
                <AppIcon
                  name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                  size={16}
                  color={BrandColors.orange}
                />
              </Pressable>
            </View>
            <Text style={styles.role}>{employee.role}</Text>
            <Badge label={employee.status} variant={getStatusVariant(employee.status)} />
          </View>
        </View>

        <View style={[styles.headerRight, isCompactLayout && styles.headerRightCompact]}>
          <View style={styles.headerMeta}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Salário base</Text>
              <Text style={styles.headerMetaValue}>{formatCurrency(employee.baseSalary)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Admissão</Text>
              <Text style={styles.headerMetaValue}>{formatHireDate(employee.hireDate)}</Text>
            </View>
          </View>
          <Button label="+ Registrar" onPress={() => setShowRegisterModal(true)} />
        </View>
      </View>

      {feedbackMessage ? <Text style={styles.feedback}>{feedbackMessage}</Text> : null}

      {isCompactLayout ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsScrollContent}>
          <ProfileTabs activeTab={activeTab} onChange={setActiveTab} compact />
        </ScrollView>
      ) : (
        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
      )}

      {activeTab === 'Resumo' && (
        <>
          <SummaryTab employeeId={employee.id} competence={profileCompetence} compact={isCompactLayout} />
          <ProfileOverview
            employee={employee}
            compact={isCompactLayout}
            isActive={employeeIsActive}
            canRemove={canRemove}
            removalNote={removalNote}
            onStatusAction={() => {
              setFeedbackMessage(null);
              if (employeeIsActive) {
                setShowDeactivateModal(true);
                return;
              }
              setShowReactivateModal(true);
            }}
            onRemove={() => {
              setFeedbackMessage(null);
              setShowRemoveModal(true);
            }}
          />
        </>
      )}
      {activeTab === 'Registros' && (
        <RecordsTab
          records={getMovementsForEmployee(employee.id, profileCompetence)}
          competenceLabel={competenceToLabel(profileCompetence)}
        />
      )}
      {activeTab === 'Fechamentos' && (
        <ClosingsTab
          employeeId={employee.id}
          employeeName={employee.name}
          competence={profileCompetence}
        />
      )}

      <RegisterFlowModal
        visible={showRegisterModal}
        employeeId={employee.id}
        employeeName={employee.name}
        onClose={() => setShowRegisterModal(false)}
        onSaved={(movement) => {
          competencePinnedRef.current = true;
          setProfileCompetence(movement.competence);
          setShowRegisterModal(false);
          setToast({ message: RECORD_SUCCESS_MESSAGE[movement.type], tone: 'success' });
        }}
      />
      <EditEmployeeModal
        visible={showEditModal}
        employee={employee}
        onClose={() => setShowEditModal(false)}
        onSave={updateEmployeeDetails}
        onSaved={() => {
          setShowEditModal(false);
          setFeedbackMessage('Alterações salvas.');
        }}
      />
      <DeactivateEmployeeModal
        visible={showDeactivateModal}
        employeeName={employee.name}
        onClose={() => setShowDeactivateModal(false)}
        onDeactivate={() => deactivateEmployee(employee.id)}
        onDeactivated={() => {
          setShowDeactivateModal(false);
          setFeedbackMessage('Funcionário desativado. As movimentações foram mantidas.');
        }}
      />
      <ReactivateEmployeeModal
        visible={showReactivateModal}
        employeeName={employee.name}
        onClose={() => setShowReactivateModal(false)}
        onReactivate={() => reactivateEmployee(employee.id)}
        onReactivated={() => {
          setShowReactivateModal(false);
          setFeedbackMessage('Funcionário reativado.');
        }}
      />
      <RemoveEmployeeModal
        visible={showRemoveModal}
        employeeName={employee.name}
        requiresDatabaseProtection={!isDemoMode}
        onClose={() => setShowRemoveModal(false)}
        onRemove={async () => {
          const hasHistory = hasEmployeeFinancialRecords(employee.id);
          return removeEmployee(employee.id, hasHistory);
        }}
        onRemoved={() => {
          setShowRemoveModal(false);
          router.push('/employees' as Href);
        }}
      />
      <Toast message={toast?.message ?? null} tone={toast?.tone} onHide={() => setToast(null)} />
    </Screen>
  );
}

function ProfileTabs({
  activeTab,
  onChange,
  compact,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.tabs, compact && styles.tabsCompact]}>
      {(['Resumo', 'Registros', 'Fechamentos'] as Tab[]).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => onChange(tab)}>
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function EditEmployeeModal({
  visible,
  employee,
  onClose,
  onSave,
  onSaved,
}: {
  visible: boolean;
  employee: Employee;
  onClose: () => void;
  onSave: ReturnType<typeof useEmployees>['updateEmployeeDetails'];
  onSaved: () => void;
}) {
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [hireDate, setHireDate] = useState(isoToDateInput(employee.hireDate));
  const [baseSalary, setBaseSalary] = useState(formatCurrency(employee.baseSalary));
  const [phone, setPhone] = useState(employee.phone ?? '');
  const [email, setEmail] = useState(employee.email ?? '');
  const [hireDateError, setHireDateError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(employee.name);
    setRole(employee.role);
    setHireDate(isoToDateInput(employee.hireDate));
    setBaseSalary(formatCurrency(employee.baseSalary));
    setPhone(employee.phone ?? '');
    setEmail(employee.email ?? '');
    setHireDateError('');
    setFormError('');
    setIsSaving(false);
  }, [visible, employee]);

  const handleSave = async () => {
    if (isSaving) return;

    setFormError('');
    setHireDateError('');

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    if (!trimmedName || !trimmedRole) {
      setFormError('Preencha nome e cargo antes de salvar.');
      return;
    }

    const dateValidation = validateHireDateInput(hireDate);
    if (!dateValidation.ok) {
      setHireDateError(dateValidation.error);
      setFormError(dateValidation.error);
      return;
    }

    const parsedSalary = parseCurrencyInput(baseSalary);
    if (parsedSalary === null) {
      setFormError('Informe o salário base.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setFormError('Informe um e-mail válido ou deixe o campo vazio.');
      return;
    }

    setIsSaving(true);
    const result = await onSave(employee.id, {
      name: trimmedName,
      role: trimmedRole,
      baseSalary: parsedSalary,
      hireDate: dateValidation.iso,
      phone,
      email: trimmedEmail,
    });
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.message);
      return;
    }

    onSaved();
  };

  return (
    <Modal title="Editar funcionário" visible={visible} onClose={onClose} wide>
      <View style={styles.form}>
        <Input label="Nome completo" value={name} onChangeText={setName} />
        <Input label="Cargo" value={role} onChangeText={setRole} />
        <MaskedInput label="Salário base" mask="currency" value={baseSalary} onChangeText={setBaseSalary} />
        <DateInput
          label="Data de admissão"
          value={hireDate}
          error={hireDateError}
          onChangeText={(value) => {
            setHireDate(value);
            if (hireDateError) setHireDateError('');
          }}
        />
        <MaskedInput label="Telefone" optional mask="phone" value={phone} onChangeText={setPhone} />
        <Input
          label="E-mail"
          optional
          placeholder="email@exemplo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <View style={styles.modalActions}>
          <Button label="Cancelar" variant="outline" onPress={onClose} disabled={isSaving} />
          <View style={styles.modalPrimary}>
            <Button
              label={isSaving ? 'Salvando...' : 'Salvar alterações'}
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

function DeactivateEmployeeModal({
  visible,
  employeeName,
  onClose,
  onDeactivate,
  onDeactivated,
}: {
  visible: boolean;
  employeeName: string;
  onClose: () => void;
  onDeactivate: () => Promise<{ success: true } | { success: false; message: string }>;
  onDeactivated: () => void;
}) {
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFormError('');
    setIsSaving(false);
  }, [visible]);

  const handleConfirm = async () => {
    if (isSaving) return;
    setFormError('');
    setIsSaving(true);
    const result = await onDeactivate();
    setIsSaving(false);
    if (!result.success) {
      setFormError(result.message);
      return;
    }
    onDeactivated();
  };

  return (
    <Modal title="Desativar funcionário" visible={visible} onClose={onClose}>
      <Text style={styles.confirmText}>
        Desativar {employeeName}? O status passa a inativo. As movimentações e o histórico financeiro
        permanecem no cadastro.
      </Text>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <View style={styles.modalActions}>
        <Button label="Cancelar" variant="outline" onPress={onClose} disabled={isSaving} />
        <View style={styles.modalPrimary}>
          <Button
            label={isSaving ? 'Desativando...' : 'Confirmar desativação'}
            fullWidth
            disabled={isSaving}
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

function ReactivateEmployeeModal({
  visible,
  employeeName,
  onClose,
  onReactivate,
  onReactivated,
}: {
  visible: boolean;
  employeeName: string;
  onClose: () => void;
  onReactivate: () => Promise<{ success: true } | { success: false; message: string }>;
  onReactivated: () => void;
}) {
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFormError('');
    setIsSaving(false);
  }, [visible]);

  const handleConfirm = async () => {
    if (isSaving) return;
    setFormError('');
    setIsSaving(true);
    const result = await onReactivate();
    setIsSaving(false);
    if (!result.success) {
      setFormError(result.message);
      return;
    }
    onReactivated();
  };

  return (
    <Modal title="Reativar funcionário" visible={visible} onClose={onClose}>
      <Text style={styles.confirmText}>
        Reativar {employeeName}? O status volta a ativo. As movimentações e o histórico financeiro
        permanecem no cadastro.
      </Text>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <View style={styles.modalActions}>
        <Button label="Cancelar" variant="outline" onPress={onClose} disabled={isSaving} />
        <View style={styles.modalPrimary}>
          <Button
            label={isSaving ? 'Reativando...' : 'Confirmar reativação'}
            fullWidth
            disabled={isSaving}
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

function RemoveEmployeeModal({
  visible,
  employeeName,
  requiresDatabaseProtection,
  onClose,
  onRemove,
  onRemoved,
}: {
  visible: boolean;
  employeeName: string;
  requiresDatabaseProtection: boolean;
  onClose: () => void;
  onRemove: () => Promise<{ success: true } | { success: false; message: string }>;
  onRemoved: () => void;
}) {
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFormError('');
    setIsSaving(false);
  }, [visible]);

  const handleConfirm = async () => {
    if (isSaving) return;
    setFormError('');
    setIsSaving(true);
    const result = await onRemove();
    setIsSaving(false);
    if (!result.success) {
      setFormError(result.message);
      return;
    }
    onRemoved();
  };

  return (
    <Modal title="Remover funcionário" visible={visible} onClose={onClose}>
      <Text style={styles.confirmText}>
        Remover {employeeName} permanentemente? O cadastro deixa de existir e esta ação não pode ser
        desfeita.
      </Text>
      {requiresDatabaseProtection ? (
        <Text style={styles.confirmText}>
          Antes de excluir, o histórico é conferido de novo no Supabase. Enquanto a foreign key das
          movimentações apagar registros em cascata, a exclusão não é executada.
        </Text>
      ) : null}
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <View style={styles.modalActions}>
        <Button label="Cancelar" variant="outline" onPress={onClose} disabled={isSaving} />
        <View style={styles.modalPrimary}>
          <Button
            label={isSaving ? 'Removendo...' : 'Confirmar exclusão'}
            fullWidth
            disabled={isSaving}
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

function SummaryTab({
  employeeId,
  competence,
  compact,
}: {
  employeeId: string;
  competence: string;
  compact?: boolean;
}) {
  const { getMovementsForEmployee, getEmployeeSummary } = useAppData();
  const movements = getMovementsForEmployee(employeeId, competence);
  const summary = getEmployeeSummary(employeeId, competence);
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
    <View style={styles.summarySection}>
      <Text style={styles.competenceHeading}>{competenceToLabel(competence)}</Text>
      <View style={[styles.summaryGrid, compact && styles.summaryGridCompact]}>
        {cards.map((card) => (
          <Card key={card.label} style={[styles.summaryCard, compact && styles.summaryCardCompact]}>
            <View style={styles.summaryTop}>
              <View style={[styles.summaryIcon, { backgroundColor: SUMMARY_ICON_BG }]}>
                <AppIcon
                  name={STAT_SYMBOLS[card.iconType]}
                  size={compact ? 16 : 18}
                  color={SUMMARY_ICON_COLOR}
                />
              </View>
              <Text style={styles.summaryLabel}>{card.label}</Text>
            </View>
            <Text style={styles.summaryValue}>{card.value}</Text>
          </Card>
        ))}
      </View>
      <Text style={styles.estimateNotice}>{ESTIMATE_DISCLAIMER}</Text>
    </View>
  );
}

function ProfileOverview({
  employee,
  compact,
  isActive,
  canRemove,
  removalNote,
  onStatusAction,
  onRemove,
}: {
  employee: Employee;
  compact?: boolean;
  isActive: boolean;
  canRemove: boolean;
  removalNote: string | null;
  onStatusAction: () => void;
  onRemove: () => void;
}) {
  const statusLabel = isActive ? 'Desativar funcionário' : 'Reativar funcionário';

  return (
    <View style={[styles.detailLayout, compact && styles.detailLayoutCompact]}>
      <Card style={styles.detailCard}>
        <SectionTitle
          label="Dados pessoais"
          icon={{ ios: 'person', android: 'person', web: 'person' }}
        />
        <FieldRow
          label="Nome completo"
          value={employee.name}
          icon={{ ios: 'person', android: 'person', web: 'person' }}
        />
        <FieldRow
          label="Telefone"
          value={employee.phone || 'Não informado'}
          muted={!employee.phone}
          icon={{ ios: 'phone', android: 'call', web: 'call' }}
        />
        <FieldRow
          label="E-mail"
          value={employee.email || 'Não informado'}
          muted={!employee.email}
          icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
        />
      </Card>

      <Card style={styles.detailCard}>
        <SectionTitle
          label="Dados profissionais"
          icon={{ ios: 'briefcase', android: 'work', web: 'work' }}
        />
        <FieldRow
          label="Cargo"
          value={employee.role}
          icon={{ ios: 'briefcase', android: 'work', web: 'work' }}
        />
        <FieldRow
          label="Salário base"
          value={formatCurrency(employee.baseSalary)}
          icon={{ ios: 'banknote', android: 'payments', web: 'payments' }}
        />
        <FieldRow
          label="Data de admissão"
          value={formatHireDate(employee.hireDate)}
          icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
        />
        {employee.inactiveDate ? (
          <FieldRow
            label="Inativo desde"
            value={formatHireDate(employee.inactiveDate)}
            icon={{ ios: 'calendar', android: 'event_busy', web: 'event_busy' }}
          />
        ) : null}
      </Card>

      <View style={[styles.sideColumn, compact && styles.sideColumnCompact]}>
        <Card style={styles.sideCard}>
          <SectionTitle
            label="Ações"
            icon={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
          />
          <Pressable
            style={isActive ? styles.actionRowDanger : styles.actionRowRestore}
            onPress={onStatusAction}
            accessibilityRole="button"
            accessibilityLabel={statusLabel}>
            <AppIcon
              name={
                isActive
                  ? { ios: 'person.crop.circle.badge.minus', android: 'person_off', web: 'person_off' }
                  : { ios: 'person.crop.circle.badge.checkmark', android: 'person_add', web: 'person_add' }
              }
              size={16}
              color={isActive ? BrandColors.red : BrandColors.green}
            />
            <Text style={isActive ? styles.actionRowDangerText : styles.actionRowRestoreText}>
              {statusLabel}
            </Text>
          </Pressable>
          {canRemove ? (
            <Pressable
              style={styles.actionRowDanger}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remover funcionário">
              <AppIcon
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={16}
                color={BrandColors.red}
              />
              <Text style={styles.actionRowDangerText}>Remover funcionário</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel="Remover funcionário"
              accessibilityHint={removalNote ?? undefined}
              style={styles.removeAction}>
              <View style={styles.removeActionRow}>
                <AppIcon
                  name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                  size={16}
                  color={BrandColors.red}
                />
                <Text style={styles.removeActionLabel}>Remover funcionário</Text>
              </View>
              {removalNote ? <Text style={styles.removeActionNote}>{removalNote}</Text> : null}
            </Pressable>
          )}
        </Card>
      </View>
    </View>
  );
}

function SectionTitle({ label, icon }: { label: string; icon: AppSymbolName }) {
  return (
    <View style={styles.sectionTitle}>
      <AppIcon name={icon} size={16} color={BrandColors.orange} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function FieldRow({
  label,
  value,
  icon,
  muted,
}: {
  label: string;
  value: string;
  icon: AppSymbolName;
  muted?: boolean;
}) {
  return (
    <View style={styles.fieldRow}>
      <AppIcon name={icon} size={16} color={BrandColors.orange} />
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, muted && styles.fieldValueMuted]}>{value}</Text>
      </View>
    </View>
  );
}

function RecordsTab({ records, competenceLabel }: { records: Movement[]; competenceLabel: string }) {
  return (
    <Card>
      <Text style={styles.competenceHeading}>{competenceLabel}</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum registro em {competenceLabel.toLowerCase()}.</Text>
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

function ClosingsTab({
  employeeId,
  employeeName,
  competence,
}: {
  employeeId: string;
  employeeName: string;
  competence: string;
}) {
  const { getEmployeeSummary } = useAppData();
  const summary = getEmployeeSummary(employeeId, competence);

  if (!summary) {
    return (
      <Card>
        <Text style={styles.emptyText}>Nenhum fechamento disponível para este funcionário.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.closingTitle}>Fechamento — {competenceToLabel(competence)}</Text>
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

function RegisterFlowModal({
  visible,
  employeeId,
  employeeName,
  onClose,
  onSaved,
}: {
  visible: boolean;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSaved: (movement: Movement) => void;
}) {
  const { addMovement } = useAppData();
  const { isDemoMode } = useEmployees();
  const [step, setStep] = useState<'types' | RecordType>('types');
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [absenceSubtype, setAbsenceSubtype] = useState<AbsenceSubtype>('Falta injustificada');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const wasVisibleRef = useRef(false);
  const defaultDateIso = isDemoMode ? DEMO_TODAY : getLocalTodayIso();

  const resetForm = (nextStep: 'types' | RecordType = 'types') => {
    setStep(nextStep);
    setOccurrenceDate(nextStep === 'types' ? '' : isoToDateInput(defaultDateIso));
    setDuration('');
    setAmount('');
    setAbsenceSubtype('Falta injustificada');
    setNotes('');
    setFormError('');
    setIsSaving(false);
  };

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setStep('types');
      setOccurrenceDate('');
      setDuration('');
      setAmount('');
      setAbsenceSubtype('Falta injustificada');
      setNotes('');
      setFormError('');
      setIsSaving(false);
    }
    wasVisibleRef.current = visible;
  }, [visible]);

  const handleSave = async () => {
    if (savingRef.current || step === 'types') return;

    setFormError('');

    if (occurrenceDate.trim() && !parseDateInputToIso(occurrenceDate)) {
      setFormError('Informe uma data válida.');
      return;
    }

    const dateIso = parseDateInputToIso(occurrenceDate) ?? defaultDateIso;
    const parsedAmount = parseCurrencyInput(amount);
    let value = '';
    let movementAmount: number | undefined;

    switch (step) {
      case 'Hora extra':
        if (valueToDecimalHours(duration.trim()) === null) {
          setFormError('Informe a duração no formato 2h30.');
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
      type: step,
      occurrenceDate: dateIso,
      competence: getCompetenceFromDate(dateIso),
      value,
      amount: movementAmount,
      notes: notes.trim() || undefined,
    };

    if (step === 'Falta') {
      movement.absenceSubtype = absenceSubtype;
      movement.estimatedDiscount =
        absenceSubtype === 'Falta injustificada' ||
        absenceSubtype === 'Atraso' ||
        absenceSubtype === 'Saída antecipada';
      if (movement.estimatedDiscount && movementAmount) {
        movement.formula = 'Salário-base ÷ 30';
      }
    }

    savingRef.current = true;
    setIsSaving(true);

    try {
      const result = await addMovement(movement);

      if (!result.success) {
        setFormError(result.message);
        return;
      }

      onSaved(result.movement);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const showCurrencyField = step === 'Vale' || step === 'Adicional' || step === 'Desconto';
  const showOptionalCurrencyField = step === 'Hora extra' || step === 'Falta';

  return (
    <Modal
      title={step === 'types' ? 'Registrar' : `Registrar ${step}`}
      visible={visible}
      onClose={onClose}>
      {step === 'types' ? (
        <>
          <Text style={styles.registerSubtitle}>Selecione o tipo de registro:</Text>
          <View style={styles.registerOptions}>
            {recordTypes.map((type) => (
              <Pressable
                key={type}
                style={styles.registerOption}
                onPress={() => resetForm(type)}>
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
        </>
      ) : (
        <View style={styles.form}>
          <DateInput label="Data do registro" value={occurrenceDate} onChangeText={setOccurrenceDate} />

          {step === 'Hora extra' && (
            <Input
              label="Duração"
              placeholder="Ex: 2h30"
              value={duration}
              onChangeText={setDuration}
            />
          )}

          {step === 'Falta' && (
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
            <Button label="Cancelar" variant="outline" onPress={onClose} disabled={isSaving} />
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
      )}
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
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  profileHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
    marginBottom: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 1,
    minWidth: 220,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    columnGap: 48,
    rowGap: 12,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  headerRightCompact: {
    width: '100%',
    marginLeft: 0,
    justifyContent: 'space-between',
    columnGap: 32,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  metaBlock: {
    gap: 2,
  },
  metaDivider: {
    width: 1,
    height: 36,
    backgroundColor: BrandColors.border,
  },
  headerMetaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
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
  profileInfo: { gap: 4, minWidth: 0, flexShrink: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  nameEditButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  role: { fontSize: 14, color: BrandColors.textSecondary },
  metaLabel: { fontSize: 12, color: BrandColors.textMuted },
  feedback: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginBottom: 12,
  },
  summarySection: {
    gap: 10,
  },
  competenceHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textSecondary,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  tabsScrollContent: {
    flexGrow: 0,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
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
  summaryCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 150,
    gap: 12,
    padding: 16,
  },
  summaryCardCompact: { minWidth: 0, width: '100%', flexBasis: 'auto', flexGrow: 0 },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { flex: 1, fontSize: 13, color: BrandColors.textSecondary },
  summaryValue: { fontSize: 22, fontWeight: '700', color: BrandColors.textPrimary },
  detailLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  detailLayoutCompact: {
    flexDirection: 'column',
  },
  detailCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 280,
    minWidth: 260,
    gap: 16,
    padding: 20,
  },
  sideColumn: {
    width: 280,
    maxWidth: '100%',
    gap: 16,
    flexGrow: 1,
    flexBasis: 260,
  },
  sideColumnCompact: {
    width: '100%',
  },
  sideCard: {
    gap: 14,
    padding: 18,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  fieldValueMuted: {
    fontWeight: '500',
    color: BrandColors.textMuted,
  },
  actionRowDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BrandColors.redLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionRowDangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.red,
  },
  actionRowRestore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BrandColors.greenLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionRowRestoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.green,
  },
  removeAction: {
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: BrandColors.offWhite,
  },
  removeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  removeActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.red,
  },
  removeActionNote: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textSecondary,
  },
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
  confirmText: {
    fontSize: 14,
    lineHeight: 21,
    color: BrandColors.textSecondary,
    marginBottom: 16,
  },
  formError: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.red,
    marginTop: 4,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalPrimary: { flex: 1 },
});
