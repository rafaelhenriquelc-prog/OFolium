export type {
  AbsenceSubtype,
  ActivityItem,
  ClosingSnapshot,
  CompetenceState,
  CompetenceStatus,
  Employee,
  EmployeeClosingSummary,
  EmployeeStatus,
  IndividualReviewStatus,
  Movement,
  NotificationItem,
  RecordType,
  SalaryHistoryEntry,
} from '@/data/types';

export {
  INITIAL_ACTIVITIES,
  INITIAL_COMPETENCE_STATE,
  INITIAL_EMPLOYEES,
  INITIAL_MOVEMENTS,
  INITIAL_NOTIFICATIONS_BASE,
  INITIAL_NOTIFICATIONS_PRO,
  MOCK_BUSINESS,
  MOCK_USER,
} from '@/data/initialData';

export { isEmployeeActive } from '@/utils/employee';

import { INITIAL_EMPLOYEES, INITIAL_MOVEMENTS } from '@/data/initialData';
import type { Employee, EmployeeClosingSummary, Movement, NotificationItem } from '@/data/types';
import {
  computeActiveClosingSummaries,
  computeEmployeeClosingSummary,
} from '@/utils/calculations';
import { CURRENT_COMPETENCE } from '@/utils/competence';

/** @deprecated Use INITIAL_EMPLOYEES */
export const employees = INITIAL_EMPLOYEES;

/** @deprecated Use INITIAL_MOVEMENTS */
export const employeeRecords = INITIAL_MOVEMENTS;

/** @deprecated Derived from shared calculations */
export const closings = computeActiveClosingSummaries(
  INITIAL_EMPLOYEES,
  INITIAL_MOVEMENTS,
  CURRENT_COMPETENCE,
  {},
);

/** @deprecated Use AppDataContext notifications */
export const notifications: NotificationItem[] = [];

/** @deprecated Use AppDataContext getMovementsForDate */
export const calendarRecords = INITIAL_MOVEMENTS.map((movement) => ({
  date: movement.occurrenceDate,
  type: movement.type,
  employeeName: movement.employeeName,
  value: movement.value,
  notes: movement.notes,
}));

export function getEmployeeById(id: string): Employee | undefined {
  return INITIAL_EMPLOYEES.find((employee) => employee.id === id);
}

export function getRecordsForEmployee(employeeId: string): Movement[] {
  return INITIAL_MOVEMENTS.filter((movement) => movement.employeeId === employeeId);
}

export function getRecordsForDate(date: string) {
  return INITIAL_MOVEMENTS.filter((movement) => movement.occurrenceDate === date).map((movement) => ({
    date: movement.occurrenceDate,
    type: movement.type,
    employeeName: movement.employeeName,
    value: movement.value,
    notes: movement.notes,
  }));
}

export function getClosingForEmployee(employeeId: string) {
  const employee = getEmployeeById(employeeId);
  if (!employee) return undefined;
  const movements = getRecordsForEmployee(employeeId).filter(
    (movement) => movement.competence === CURRENT_COMPETENCE,
  );
  return computeEmployeeClosingSummary(employee, movements);
}
