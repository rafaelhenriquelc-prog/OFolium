import type {
  Employee,
  EmployeeClosingSummary,
  IndividualReviewStatus,
  Movement,
} from '@/data/types';
import { isEmployeeActive } from '@/utils/employee';

export const ESTIMATE_DISCLAIMER =
  'Cálculo gerencial estimado. O valor oficial deverá ser confirmado pela contabilidade.';

export const MANAGERIAL_DISCLAIMER =
  'Os valores apresentados possuem finalidade gerencial e não substituem a folha de pagamento oficial ou a conferência contábil.';

export function parseHoursToMinutes(value: string): number {
  const hoursMatch = value.match(/(\d+)\s*h/);
  const minutesMatch = value.match(/(\d+)\s*(?:min|m(?!ês))/i) ?? value.match(/h(\d+)/);
  const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0;
  return hours * 60 + minutes;
}

export function formatMinutesAsHours(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

export function shouldApplyDiscount(movement: Movement): boolean {
  if (movement.type !== 'Falta') return movement.type === 'Desconto';
  return (
    movement.estimatedDiscount === true ||
    movement.absenceSubtype === 'Falta injustificada' ||
    movement.absenceSubtype === 'Atraso' ||
    movement.absenceSubtype === 'Saída antecipada' ||
    !movement.absenceSubtype
  );
}

export function sumMovementsByType(movements: Movement[]) {
  let extras = 0;
  let additions = 0;
  let vales = 0;
  let discounts = 0;
  let overtimeMinutes = 0;
  let absenceCount = 0;

  for (const movement of movements) {
    if (movement.type === 'Hora extra') {
      extras += movement.amount ?? 0;
      overtimeMinutes += parseHoursToMinutes(movement.value);
    }
    if (movement.type === 'Adicional') additions += movement.amount ?? 0;
    if (movement.type === 'Vale') vales += movement.amount ?? 0;
    if (movement.type === 'Falta') {
      absenceCount += 1;
      if (shouldApplyDiscount(movement)) discounts += movement.amount ?? 0;
    }
    if (movement.type === 'Desconto') discounts += movement.amount ?? 0;
  }

  return { extras, additions, vales, discounts, overtimeMinutes, absenceCount };
}

export function computeEmployeeClosingSummary(
  employee: Employee,
  movements: Movement[],
  reviewStatus: IndividualReviewStatus = 'Pendente',
): EmployeeClosingSummary {
  const totals = sumMovementsByType(movements);
  const forecast = employee.baseSalary + totals.extras + totals.additions - totals.vales - totals.discounts;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    baseSalary: employee.baseSalary,
    extras: totals.extras,
    additions: totals.additions,
    vales: totals.vales,
    discounts: totals.discounts,
    forecast,
    reviewStatus,
  };
}

export function computeActiveClosingSummaries(
  employees: Employee[],
  movements: Movement[],
  competence: string,
  reviewStatuses: Record<string, IndividualReviewStatus>,
): EmployeeClosingSummary[] {
  return employees
    .filter((employee) => isEmployeeActive(employee.status))
    .map((employee) => {
      const employeeMovements = movements.filter(
        (movement) => movement.employeeId === employee.id && movement.competence === competence,
      );
      return computeEmployeeClosingSummary(
        employee,
        employeeMovements,
        reviewStatuses[employee.id] ?? 'Pendente',
      );
    });
}

export function countOvertimeEmployees(movements: Movement[], competence: string): number {
  const ids = new Set(
    movements
      .filter((movement) => movement.competence === competence && movement.type === 'Hora extra')
      .map((movement) => movement.employeeId),
  );
  return ids.size;
}
