import type { Employee, Movement, RecordType } from '@/data/types';
import {
  computeEmployeeClosingSummary,
  formatMinutesAsHours,
  sumMovementsByType,
} from '@/utils/calculations';
import { competenceToLabel, CURRENT_COMPETENCE } from '@/utils/competence';
import { isEmployeeActive } from '@/utils/employee';

export type ReportEmployeeFilter = 'all' | string;
export type ReportRecordTypeFilter = 'all' | RecordType;

export type ReportFilters = {
  employeeId: ReportEmployeeFilter;
  competence: string;
  recordType: ReportRecordTypeFilter;
};

export type ReportFilterOption<T extends string = string> = {
  value: T;
  label: string;
};

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  employeeId: 'all',
  competence: CURRENT_COMPETENCE,
  recordType: 'all',
};

export const REPORT_RECORD_TYPE_OPTIONS: ReportFilterOption<ReportRecordTypeFilter>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Hora extra', label: 'Horas extras' },
  { value: 'Vale', label: 'Vales' },
  { value: 'Adicional', label: 'Adicionais' },
  { value: 'Falta', label: 'Faltas' },
  { value: 'Desconto', label: 'Descontos' },
];

export function getAvailableCompetences(movements: Movement[]): string[] {
  return [...new Set(movements.map((movement) => movement.competence))].sort((a, b) => b.localeCompare(a));
}

function scopeEmployees(
  employees: Employee[],
  employeeId: ReportEmployeeFilter,
  competence: string,
  movements: Movement[],
): Employee[] {
  if (employeeId !== 'all') {
    const employee = employees.find((item) => item.id === employeeId);
    return employee ? [employee] : [];
  }

  const employeeIdsWithMovements = new Set(
    movements.filter((movement) => movement.competence === competence).map((movement) => movement.employeeId),
  );

  return employees.filter(
    (employee) => isEmployeeActive(employee.status) || employeeIdsWithMovements.has(employee.id),
  );
}

export function buildEmployeeFilterOptions(
  employees: Employee[],
  movements: Movement[],
  competence?: string,
): ReportFilterOption<ReportEmployeeFilter>[] {
  const employeeIdsWithMovements = new Set(
    movements
      .filter((movement) => !competence || movement.competence === competence)
      .map((movement) => movement.employeeId),
  );

  const availableEmployees = employees.filter(
    (employee) => isEmployeeActive(employee.status) || employeeIdsWithMovements.has(employee.id),
  );

  return [
    { value: 'all', label: 'Todos' },
    ...availableEmployees.map((employee) => ({ value: employee.id, label: employee.name })),
  ];
}

export function buildCompetenceFilterOptions(competences: string[]): ReportFilterOption[] {
  return competences.map((competence) => ({
    value: competence,
    label: competenceToLabel(competence),
  }));
}

export function isReportFiltersDirty(filters: ReportFilters): boolean {
  return (
    filters.employeeId !== DEFAULT_REPORT_FILTERS.employeeId ||
    filters.competence !== DEFAULT_REPORT_FILTERS.competence ||
    filters.recordType !== DEFAULT_REPORT_FILTERS.recordType
  );
}

export function filterReportMovements(
  movements: Movement[],
  filters: ReportFilters,
): Movement[] {
  return movements.filter((movement) => {
    if (movement.competence !== filters.competence) return false;
    if (filters.employeeId !== 'all' && movement.employeeId !== filters.employeeId) return false;
    if (filters.recordType !== 'all' && movement.type !== filters.recordType) return false;
    return true;
  });
}

export type ReportSummaryRow = {
  employeeId: string;
  employeeName: string;
  role: string;
  forecast: number;
};

export type ReportMovementRow = {
  id: string;
  employeeName: string;
  role: string;
  occurrenceDate: string;
  type: RecordType;
  value: string;
  amount: number;
};

export type ReportComputedData = {
  competenceLabel: string;
  employeeLabel: string;
  recordTypeLabel: string;
  totalForecast: number;
  overtimeHours: string;
  valesTotal: number;
  absenceCount: number;
  summaryRows: ReportSummaryRow[];
  movementRows: ReportMovementRow[];
  isEmpty: boolean;
};

export function computeReportData(
  employees: Employee[],
  movements: Movement[],
  filters: ReportFilters,
  getMovementsForEmployee: (employeeId: string, competence?: string) => Movement[],
): ReportComputedData {
  const filteredMovements = filterReportMovements(movements, filters);
  const competenceLabel = competenceToLabel(filters.competence);
  const employeeLabel =
    filters.employeeId === 'all'
      ? 'Todos os funcionários'
      : (employees.find((employee) => employee.id === filters.employeeId)?.name ?? 'Funcionário');
  const recordTypeLabel =
    REPORT_RECORD_TYPE_OPTIONS.find((option) => option.value === filters.recordType)?.label ?? 'Todos';

  if (filters.recordType !== 'all') {
    const totals = sumMovementsByType(filteredMovements);
    const movementRows: ReportMovementRow[] = filteredMovements
      .slice()
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate))
      .map((movement) => {
        const employee = employees.find((item) => item.id === movement.employeeId);
        return {
          id: movement.id,
          employeeName: movement.employeeName,
          role: employee?.role ?? '—',
          occurrenceDate: movement.occurrenceDate,
          type: movement.type,
          value: movement.value,
          amount: movement.amount ?? 0,
        };
      });

    const typeTotal =
      filters.recordType === 'Hora extra'
        ? totals.extras
        : filters.recordType === 'Vale'
          ? totals.vales
          : filters.recordType === 'Adicional'
            ? totals.additions
            : filters.recordType === 'Falta' || filters.recordType === 'Desconto'
              ? totals.discounts
              : 0;

    return {
      competenceLabel,
      employeeLabel,
      recordTypeLabel,
      totalForecast: typeTotal,
      overtimeHours: formatMinutesAsHours(totals.overtimeMinutes),
      valesTotal: totals.vales,
      absenceCount: totals.absenceCount,
      summaryRows: [],
      movementRows,
      isEmpty: movementRows.length === 0,
    };
  }

  const scopedEmployees = scopeEmployees(employees, filters.employeeId, filters.competence, movements);
  const summaryRows: ReportSummaryRow[] = scopedEmployees.map((employee) => {
    const summary = computeEmployeeClosingSummary(
      employee,
      getMovementsForEmployee(employee.id, filters.competence),
    );
    return {
      employeeId: summary.employeeId,
      employeeName: summary.employeeName,
      role: summary.role,
      forecast: summary.forecast,
    };
  });

  const competenceMovements = movements.filter((movement) => {
    if (movement.competence !== filters.competence) return false;
    if (filters.employeeId !== 'all' && movement.employeeId !== filters.employeeId) return false;
    return true;
  });
  const totals = sumMovementsByType(competenceMovements);

  return {
    competenceLabel,
    employeeLabel,
    recordTypeLabel,
    totalForecast: summaryRows.reduce((sum, row) => sum + row.forecast, 0),
    overtimeHours: formatMinutesAsHours(totals.overtimeMinutes),
    valesTotal: totals.vales,
    absenceCount: totals.absenceCount,
    summaryRows,
    movementRows: [],
    isEmpty: summaryRows.length === 0,
  };
}
