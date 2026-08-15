import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { INITIAL_EMPLOYEES } from '@/data/initialData';
import type { Employee, EmployeeStatus } from '@/data/types';
import { usePlan } from '@/contexts/PlanContext';
import { isEmployeeActive } from '@/utils/employee';

export type NewEmployeeInput = {
  name: string;
  role: string;
  status: EmployeeStatus;
  baseSalary: number;
  hireDate: string;
  phone?: string;
  email?: string;
};

type AddEmployeeResult =
  | { success: true; employee: Employee }
  | { success: false; reason: 'limit_reached' | 'invalid' | 'busy' };

type EmployeesContextValue = {
  employees: Employee[];
  activeCount: number;
  isSubmitting: boolean;
  addEmployee: (input: NewEmployeeInput) => AddEmployeeResult;
  deactivateEmployee: (id: string) => void;
  updateEmployeeSalary: (id: string, salary: number, effectiveDate: string) => void;
  getEmployeeById: (id: string) => Employee | undefined;
};

const EmployeesContext = createContext<EmployeesContextValue | null>(null);

const AVATAR_COLORS = ['#FF5C00', '#3B82F6', '#22A06B', '#F5A623', '#E5484D', '#8B5CF6', '#06B6D4', '#9B9BA6'];

function buildInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function normalizeActiveStatus(status: EmployeeStatus): EmployeeStatus {
  if (status === 'Inativo') return 'Inativo';
  if (status === 'Inativa') return 'Inativa';
  return status === 'Ativa' ? 'Ativa' : 'Ativo';
}

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const { activeLimit } = usePlan();
  const [employees, setEmployees] = useState<Employee[]>(() =>
    INITIAL_EMPLOYEES.map((employee) => ({ ...employee })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCount = useMemo(
    () => employees.filter((employee) => isEmployeeActive(employee.status)).length,
    [employees],
  );

  const getEmployeeById = useCallback(
    (id: string) => employees.find((employee) => employee.id === id),
    [employees],
  );

  const addEmployee = useCallback(
    (input: NewEmployeeInput): AddEmployeeResult => {
      if (isSubmitting) return { success: false, reason: 'busy' };

      const trimmedName = input.name.trim();
      const trimmedRole = input.role.trim();

      if (!trimmedName || !trimmedRole) {
        return { success: false, reason: 'invalid' };
      }

      const status = normalizeActiveStatus(input.status);
      const willBeActive = isEmployeeActive(status);

      if (willBeActive && activeCount >= activeLimit) {
        return { success: false, reason: 'limit_reached' };
      }

      setIsSubmitting(true);
      const nextId = String(
        Math.max(0, ...employees.map((employee) => Number.parseInt(employee.id, 10) || 0)) + 1,
      );

      const employee: Employee = {
        id: nextId,
        name: trimmedName,
        role: trimmedRole,
        status,
        baseSalary: input.baseSalary,
        hireDate: input.hireDate,
        phone: input.phone?.trim() || undefined,
        email: input.email?.trim() || undefined,
        initials: buildInitials(trimmedName),
        avatarColor: AVATAR_COLORS[employees.length % AVATAR_COLORS.length],
        salaryHistory: [{ salary: input.baseSalary, effectiveDate: input.hireDate }],
      };

      setEmployees((current) => [...current, employee]);
      setTimeout(() => setIsSubmitting(false), 400);
      return { success: true, employee };
    },
    [activeCount, activeLimit, employees, isSubmitting],
  );

  const deactivateEmployee = useCallback((id: string) => {
    setEmployees((current) =>
      current.map((employee) => {
        if (employee.id !== id) return employee;
        const inactiveStatus: EmployeeStatus = employee.status === 'Ativa' ? 'Inativa' : 'Inativo';
        return {
          ...employee,
          status: inactiveStatus,
          inactiveDate: new Date().toISOString().slice(0, 10),
        };
      }),
    );
  }, []);

  const updateEmployeeSalary = useCallback((id: string, salary: number, effectiveDate: string) => {
    setEmployees((current) =>
      current.map((employee) => {
        if (employee.id !== id) return employee;
        return {
          ...employee,
          baseSalary: salary,
          salaryHistory: [...employee.salaryHistory, { salary, effectiveDate }],
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      employees,
      activeCount,
      isSubmitting,
      addEmployee,
      deactivateEmployee,
      updateEmployeeSalary,
      getEmployeeById,
    }),
    [
      employees,
      activeCount,
      isSubmitting,
      addEmployee,
      deactivateEmployee,
      updateEmployeeSalary,
      getEmployeeById,
    ],
  );

  return <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>;
}

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error('useEmployees must be used within EmployeesProvider');
  }
  return context;
}
