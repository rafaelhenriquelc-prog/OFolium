import { useRouter, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BrandColors } from '@/constants/colors';
import {
  INITIAL_ACTIVITIES,
  INITIAL_COMPETENCE_STATE,
  INITIAL_MOVEMENTS,
  INITIAL_NOTIFICATIONS_BASE,
  INITIAL_NOTIFICATIONS_PRO,
} from '@/data/initialData';
import type {
  ActivityItem,
  ClosingSnapshot,
  CompetenceState,
  DashboardStats,
  EmployeeClosingSummary,
  Movement,
  NotificationItem,
} from '@/data/types';
import {
  computeActiveClosingSummaries,
  computeEmployeeClosingSummary,
  countOvertimeEmployees,
  formatMinutesAsHours,
  sumMovementsByType,
} from '@/utils/calculations';
import { competenceToLabel, CURRENT_COMPETENCE, getCompetenceFromDate } from '@/utils/competence';
import { useEmployees } from '@/contexts/EmployeesContext';
import { usePlan } from '@/contexts/PlanContext';

type ProFeatureKey =
  | 'close_competence'
  | 'review_employee'
  | 'export_pdf'
  | 'export_spreadsheet'
  | 'reopen_competence'
  | 'closing_history'
  | 'month_comparison';

const PRO_FEATURE_MESSAGES: Record<ProFeatureKey, string> = {
  close_competence:
    'O fechamento preservado da competência está disponível no OFolium Pro. Revise o mês por funcionário e preserve os dados encerrados.',
  review_employee:
    'A revisão formal do mês por funcionário está disponível no OFolium Pro.',
  export_pdf:
    'A exportação em PDF é exclusiva do plano Pro.',
  export_spreadsheet:
    'A exportação em Excel e CSV está disponível no OFolium Pro.',
  reopen_competence:
    'A reabertura de fechamento com justificativa está disponível no OFolium Pro.',
  closing_history:
    'O histórico completo de fechamentos está disponível no OFolium Pro.',
  month_comparison:
    'A comparação entre meses está disponível no OFolium Pro.',
};

type AppDataContextValue = {
  currentCompetence: string;
  competenceLabel: string;
  competenceStatus: CompetenceState['status'];
  movements: Movement[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  activities: ActivityItem[];
  dashboardStats: DashboardStats;
  closingSummaries: EmployeeClosingSummary[];
  totalForecast: number;
  valesTotal: number;
  absenceCount: number;
  overtimeHours: string;
  overtimeEmployeeCount: number;
  isCompetenceClosed: boolean;
  closingSnapshot: ClosingSnapshot | null;
  getMovementsForDate: (date: string) => Movement[];
  getMovementsForEmployee: (employeeId: string, competence?: string) => Movement[];
  getEmployeeSummary: (employeeId: string, competence?: string) => EmployeeClosingSummary | undefined;
  getWeekMovements: (startDay: number, endDay: number, competence?: string) => Movement[];
  markEmployeeReviewed: (employeeId: string) => void;
  closeCompetence: () => boolean;
  reopenCompetence: (reason: string) => boolean;
  addMovement: (movement: Omit<Movement, 'id' | 'createdAt'>) => Movement;
  updateMovement: (id: string, patch: Partial<Movement>) => void;
  removeMovement: (id: string) => void;
  markNotificationRead: (id: string) => void;
  openProFeature: (feature: ProFeatureKey) => void;
  ProFeatureModalHost: () => ReactNode;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function buildSnapshot(
  competence: string,
  summaries: EmployeeClosingSummary[],
  movements: Movement[],
  reviewStatuses: Record<string, 'Pendente' | 'Revisado'>,
): ClosingSnapshot {
  const employees = summaries.map((summary) => ({
    employeeId: summary.employeeId,
    employeeName: summary.employeeName,
    role: summary.role,
    baseSalary: summary.baseSalary,
    movements: movements.filter(
      (movement) =>
        movement.employeeId === summary.employeeId && movement.competence === competence,
    ),
    extras: summary.extras,
    additions: summary.additions,
    vales: summary.vales,
    discounts: summary.discounts,
    forecast: summary.forecast,
    reviewStatus: reviewStatuses[summary.employeeId] ?? 'Pendente',
  }));

  return {
    id: `snapshot-${competence}-${Date.now()}`,
    competence,
    closedAt: new Date().toISOString(),
    employees,
    totalForecast: summaries.reduce((sum, item) => sum + item.forecast, 0),
    status: 'Fechado',
    previousVersions: [],
    reopenHistory: [],
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { employees } = useEmployees();
  const { isPro } = usePlan();
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>(() => [...INITIAL_MOVEMENTS]);
  const [competenceState, setCompetenceState] = useState<CompetenceState>(() => ({
    ...INITIAL_COMPETENCE_STATE,
  }));
  const [activities, setActivities] = useState<ActivityItem[]>(() => [...INITIAL_ACTIVITIES]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [proFeature, setProFeature] = useState<ProFeatureKey | null>(null);

  const notifications = useMemo(() => {
    const base = INITIAL_NOTIFICATIONS_BASE.map((item) => ({
      ...item,
      read: readNotificationIds.has(item.id) || item.read,
    }));
    if (!isPro) return base;
    const proItems = INITIAL_NOTIFICATIONS_PRO.map((item) => ({
      ...item,
      read: readNotificationIds.has(item.id),
    }));
    return [...proItems, ...base];
  }, [isPro, readNotificationIds]);

  const unreadNotificationCount = notifications.filter((item) => !item.read).length;

  const currentMovements = useMemo(() => {
    if (competenceState.snapshot?.competence === competenceState.competence) {
      return competenceState.snapshot.employees.flatMap((employee) => employee.movements);
    }
    return movements;
  }, [competenceState, movements]);

  const closingSummaries = useMemo(() => {
    if (competenceState.snapshot?.competence === CURRENT_COMPETENCE) {
      return competenceState.snapshot.employees.map((employee) => ({
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        role: employee.role,
        baseSalary: employee.baseSalary,
        extras: employee.extras,
        additions: employee.additions,
        vales: employee.vales,
        discounts: employee.discounts,
        forecast: employee.forecast,
        reviewStatus: employee.reviewStatus,
      }));
    }
    return computeActiveClosingSummaries(
      employees,
      currentMovements,
      CURRENT_COMPETENCE,
      competenceState.reviewStatuses,
    );
  }, [competenceState, currentMovements, employees]);

  const competenceTotals = useMemo(
    () => sumMovementsByType(currentMovements.filter((movement) => movement.competence === CURRENT_COMPETENCE)),
    [currentMovements],
  );

  const totalForecast = closingSummaries.reduce((sum, item) => sum + item.forecast, 0);
  const overtimeHours = formatMinutesAsHours(competenceTotals.overtimeMinutes);
  const overtimeEmployeeCount = countOvertimeEmployees(currentMovements, CURRENT_COMPETENCE);

  const dashboardStats = useMemo<DashboardStats>(
    () => ({
      activeEmployees: employees.filter((employee) => employee.status === 'Ativo' || employee.status === 'Ativa').length,
      monthForecast: totalForecast,
      overtimeHours,
      overtimeEmployeeCount,
      pendingCount: isPro
        ? closingSummaries.filter((item) => item.reviewStatus !== 'Revisado').length
        : notifications.filter((item) => !item.read && !item.proOnly).length,
      competenceLabel: competenceToLabel(CURRENT_COMPETENCE),
    }),
    [closingSummaries, employees, isPro, notifications, overtimeEmployeeCount, overtimeHours, totalForecast],
  );

  const getMovementsForDate = useCallback(
    (date: string) =>
      currentMovements
        .filter((movement) => movement.occurrenceDate === date)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [currentMovements],
  );

  const getMovementsForEmployee = useCallback(
    (employeeId: string, competence = CURRENT_COMPETENCE) =>
      currentMovements
        .filter((movement) => movement.employeeId === employeeId && movement.competence === competence)
        .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate)),
    [currentMovements],
  );

  const getEmployeeSummary = useCallback(
    (employeeId: string, competence = CURRENT_COMPETENCE) => {
      const snapshotSummary = closingSummaries.find((item) => item.employeeId === employeeId);
      if (snapshotSummary) return snapshotSummary;
      const employee = employees.find((item) => item.id === employeeId);
      if (!employee) return undefined;
      return computeEmployeeClosingSummary(
        employee,
        getMovementsForEmployee(employeeId, competence),
        competenceState.reviewStatuses[employeeId] ?? 'Pendente',
      );
    },
    [closingSummaries, competenceState.reviewStatuses, employees, getMovementsForEmployee],
  );

  const getWeekMovements = useCallback(
    (startDay: number, endDay: number, competence = CURRENT_COMPETENCE) => {
      const [year, month] = competence.split('-');
      return currentMovements
        .filter((movement) => {
          if (movement.competence !== competence) return false;
          const day = Number.parseInt(movement.occurrenceDate.split('-')[2] ?? '0', 10);
          return day >= startDay && day <= endDay;
        })
        .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
    },
    [currentMovements],
  );

  const markEmployeeReviewed = useCallback((employeeId: string) => {
    setCompetenceState((current) => ({
      ...current,
      reviewStatuses: { ...current.reviewStatuses, [employeeId]: 'Revisado' },
      status: current.status === 'Pendente' ? 'Em revisão' : current.status,
    }));
  }, []);

  const closeCompetence = useCallback(() => {
    const allReviewed = closingSummaries.every((item) => item.reviewStatus === 'Revisado');
    if (!allReviewed) return false;
    const snapshot = buildSnapshot(
      CURRENT_COMPETENCE,
      closingSummaries,
      movements,
      competenceState.reviewStatuses,
    );
    setCompetenceState((current) => ({
      ...current,
      status: 'Fechado',
      snapshot,
    }));
    return true;
  }, [closingSummaries, competenceState.reviewStatuses, movements]);

  const reopenCompetence = useCallback(
    (reason: string) => {
      if (!competenceState.snapshot) return false;
      const previous = competenceState.snapshot;
      setCompetenceState((current) => ({
        ...current,
        status: 'Em revisão',
        snapshot: null,
        archivedSnapshots: [
          ...current.archivedSnapshots,
          {
            ...previous,
            reopenHistory: [...previous.reopenHistory, { at: new Date().toISOString(), reason }],
          },
        ],
      }));
      return true;
    },
    [competenceState.snapshot],
  );

  const addMovement = useCallback((input: Omit<Movement, 'id' | 'createdAt'>) => {
    const movement: Movement = {
      ...input,
      id: `m-${Date.now()}`,
      competence: input.competence || getCompetenceFromDate(input.occurrenceDate),
      createdAt: new Date().toISOString(),
    };
    setMovements((current) => [...current, movement]);
    setActivities((current) => [
      {
        id: `a-${Date.now()}`,
        title: `${movement.type} registrado para ${movement.employeeName.split(' ')[0]}`,
        detail: movement.value,
        time: 'Agora',
        icon: movement.type === 'Hora extra' ? '◷' : '◈',
        iconBg: BrandColors.orangeLight,
        iconColor: BrandColors.orange,
        createdAt: movement.createdAt,
      },
      ...current,
    ].slice(0, 8));
    return movement;
  }, []);

  const updateMovement = useCallback((id: string, patch: Partial<Movement>) => {
    setMovements((current) => current.map((movement) => (movement.id === id ? { ...movement, ...patch } : movement)));
  }, []);

  const removeMovement = useCallback((id: string) => {
    setMovements((current) => current.filter((movement) => movement.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setReadNotificationIds((current) => new Set(current).add(id));
  }, []);

  const openProFeature = useCallback((feature: ProFeatureKey) => {
    if (isPro) return;
    setProFeature(feature);
  }, [isPro]);

  const ProFeatureModalHost = useCallback(
    () => (
      <Modal
        title="Recurso disponível no OFolium Pro"
        visible={proFeature !== null}
        onClose={() => setProFeature(null)}>
        <Text style={styles.proModalText}>
          {proFeature ? PRO_FEATURE_MESSAGES[proFeature] : ''}
        </Text>
        <View style={styles.proModalActions}>
          <Button label="Agora não" variant="outline" onPress={() => setProFeature(null)} />
          <View style={styles.proModalPrimary}>
            <Button
              label="Conhecer Pro"
              fullWidth
              onPress={() => {
                setProFeature(null);
                router.push('/pro' as Href);
              }}
            />
          </View>
        </View>
      </Modal>
    ),
    [proFeature, router],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      currentCompetence: CURRENT_COMPETENCE,
      competenceLabel: competenceToLabel(CURRENT_COMPETENCE),
      competenceStatus: competenceState.status,
      movements: currentMovements,
      notifications,
      unreadNotificationCount,
      activities,
      dashboardStats,
      closingSummaries,
      totalForecast,
      valesTotal: competenceTotals.vales,
      absenceCount: competenceTotals.absenceCount,
      overtimeHours,
      overtimeEmployeeCount,
      isCompetenceClosed: competenceState.status === 'Fechado',
      closingSnapshot: competenceState.snapshot,
      getMovementsForDate,
      getMovementsForEmployee,
      getEmployeeSummary,
      getWeekMovements,
      markEmployeeReviewed,
      closeCompetence,
      reopenCompetence,
      addMovement,
      updateMovement,
      removeMovement,
      markNotificationRead,
      openProFeature,
      ProFeatureModalHost,
    }),
    [
      activities,
      closeCompetence,
      competenceState,
      competenceTotals,
      currentMovements,
      dashboardStats,
      closingSummaries,
      getEmployeeSummary,
      getMovementsForDate,
      getMovementsForEmployee,
      getWeekMovements,
      markEmployeeReviewed,
      markNotificationRead,
      notifications,
      openProFeature,
      ProFeatureModalHost,
      reopenCompetence,
      addMovement,
      updateMovement,
      removeMovement,
      totalForecast,
      unreadNotificationCount,
      overtimeEmployeeCount,
      overtimeHours,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}

export type { ProFeatureKey };

export function ProLockedButton({
  label,
  feature,
  onPress,
  fullWidth,
}: {
  label: string;
  feature: ProFeatureKey;
  onPress?: () => void;
  fullWidth?: boolean;
}) {
  const { isPro } = usePlan();
  const { openProFeature } = useAppData();

  if (isPro) {
    return <Button label={label} fullWidth={fullWidth} onPress={onPress} />;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.lockedButton,
        fullWidth && styles.lockedButtonFull,
        pressed && styles.lockedButtonPressed,
      ]}
      onPress={() => openProFeature(feature)}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Recurso Pro.`}>
      <Text style={styles.lockIcon}>🔒</Text>
      <Text style={styles.lockedLabel}>{label}</Text>
      <View style={styles.proBadge}>
        <Text style={styles.proBadgeText}>Pro</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  proModalText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
    marginBottom: 24,
  },
  proModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  proModalPrimary: {
    flex: 1,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.offWhite,
    opacity: 0.92,
  },
  lockedButtonFull: {
    width: '100%',
    justifyContent: 'center',
  },
  lockedButtonPressed: {
    opacity: 0.8,
  },
  lockIcon: {
    fontSize: 12,
  },
  lockedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
  },
  proBadge: {
    marginLeft: 'auto',
    backgroundColor: BrandColors.orangeLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.orange,
  },
});
