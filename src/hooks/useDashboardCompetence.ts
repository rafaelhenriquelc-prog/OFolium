import { useMemo } from 'react';

import { useAppData } from '@/contexts/AppDataContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { usePlan } from '@/contexts/PlanContext';
import type { DashboardPendingItem, EmployeeClosingSummary, Movement } from '@/data/types';
import {
  computeActiveClosingSummaries,
  countOvertimeEmployees,
  formatMinutesAsHours,
  sumMovementsByType,
} from '@/utils/calculations';
import { competenceToLabel } from '@/utils/competence';

export type DashboardCompetenceView = {
  competenceLabel: string;
  summaries: EmployeeClosingSummary[];
  totalForecast: number;
  competenceMovements: Movement[];
  overtimeHours: string;
  overtimeEmployeeCount: number;
  pendingItems: DashboardPendingItem[];
  pendingTitle: string;
  pendingEmptyMessage: string;
  pendingShortcut: string;
  showPendingShortcut: boolean;
  pendingDetailsPath: string;
};

export function useDashboardCompetence(competence: string): DashboardCompetenceView {
  const {
    currentCompetence,
    movements,
    closingSummaries,
    totalForecast,
    dashboardPendingItems,
    pendingDetailsPath,
  } = useAppData();
  const { employees } = useEmployees();
  const { isPro } = usePlan();

  return useMemo(() => {
    const isTrackedCompetence = competence === currentCompetence;
    const competenceMovements = movements.filter((movement) => movement.competence === competence);
    const summaries = isTrackedCompetence
      ? closingSummaries
      : computeActiveClosingSummaries(employees, movements, competence, {});
    const forecast = isTrackedCompetence
      ? totalForecast
      : summaries.reduce((sum, item) => sum + item.forecast, 0);
    const totals = sumMovementsByType(competenceMovements);

    const pendingItems = isPro && !isTrackedCompetence ? [] : dashboardPendingItems;
    const pendingTitle = isPro ? 'Pendências de revisão' : 'Pendências para conferir';
    const pendingShortcut = isPro ? 'Ver fechamentos' : 'Ver notificações';
    const pendingEmptyMessage =
      isPro && !isTrackedCompetence
        ? 'Não há revisão de fechamento registrada para esta competência.'
        : isPro
          ? 'Todos os fechamentos da competência atual já foram revisados.'
          : 'Não há notificações pendentes para conferir no momento.';

    return {
      competenceLabel: competenceToLabel(competence),
      summaries,
      totalForecast: forecast,
      competenceMovements,
      overtimeHours: formatMinutesAsHours(totals.overtimeMinutes),
      overtimeEmployeeCount: countOvertimeEmployees(competenceMovements, competence),
      pendingItems,
      pendingTitle,
      pendingEmptyMessage,
      pendingShortcut,
      showPendingShortcut: !(isPro && !isTrackedCompetence),
      pendingDetailsPath,
    };
  }, [
    closingSummaries,
    competence,
    currentCompetence,
    dashboardPendingItems,
    employees,
    isPro,
    movements,
    pendingDetailsPath,
    totalForecast,
  ]);
}
