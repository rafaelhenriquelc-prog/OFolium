import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { INITIAL_EMPLOYEES } from '@/data/initialData';
import type { Employee, EmployeeStatus } from '@/data/types';
import {
  createEmployee,
  deactivateEmployeeRecord,
  listEmployeesByBusiness,
  reactivateEmployeeRecord,
  updateEmployee,
} from '@/services/employees';
import { countMovementsForEmployee } from '@/services/movements';
import { isDemoAccount } from '@/utils/demoAccount';
import { getLocalTodayIso } from '@/utils/dateInput';
import { isEmployeeActive } from '@/utils/employee';

export const EMPLOYEE_LINKED_HISTORY_MESSAGE =
  'Este funcionário possui registros financeiros vinculados. Para preservar o histórico, não é possível removê-lo permanentemente. Você pode desativá-lo.';

const EMPLOYEE_DELETE_BLOCKED_MESSAGE =
  'A exclusão não foi realizada. A tabela de movimentações ainda apaga os registros em cascata. A proteção no Supabase precisa ser autorizada antes de remover um funcionário de verdade.';

export type NewEmployeeInput = {
  name: string;
  role: string;
  status: EmployeeStatus;
  baseSalary: number;
  hireDate: string;
  phone?: string;
  email?: string;
};

export type AddEmployeeResult =
  | { success: true; employee: Employee }
  | {
      success: false;
      reason: 'limit_reached' | 'invalid' | 'busy' | 'error' | 'unavailable';
      message?: string;
    };

export type EmployeeDetailsInput = {
  name: string;
  role: string;
  baseSalary: number;
  hireDate: string;
  phone?: string;
  email?: string;
};

export type EmployeeMutationResult =
  | { success: true }
  | { success: false; message: string };

type EmployeesContextValue = {
  employees: Employee[];
  activeCount: number;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  isDemoMode: boolean;
  reloadEmployees: () => Promise<void>;
  addEmployee: (input: NewEmployeeInput) => Promise<AddEmployeeResult>;
  updateEmployeeDetails: (id: string, input: EmployeeDetailsInput) => Promise<EmployeeMutationResult>;
  deactivateEmployee: (id: string) => Promise<EmployeeMutationResult>;
  reactivateEmployee: (id: string) => Promise<EmployeeMutationResult>;
  removeEmployee: (id: string, hasLocalFinancialHistory?: boolean) => Promise<EmployeeMutationResult>;
  countEmployeeMovements: (id: string) => Promise<{ count: number | null; message?: string }>;
  updateEmployeeSalary: (id: string, salary: number, effectiveDate: string) => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
};

const EmployeesContext = createContext<EmployeesContextValue | null>(null);

const AVATAR_COLORS = [
  '#FF5C00',
  '#3B82F6',
  '#22A06B',
  '#F5A623',
  '#E5484D',
  '#8B5CF6',
  '#06B6D4',
  '#9B9BA6',
];

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

function cloneDemoEmployees(): Employee[] {
  return INITIAL_EMPLOYEES.map((employee) => ({
    ...employee,
    salaryHistory: employee.salaryHistory.map((entry) => ({ ...entry })),
  }));
}

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const { activeLimit } = usePlan();
  const { user, business, isBusinessLoading, businessError } = useAuth();

  const isDemoMode = isDemoAccount(user?.email);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequestIdRef = useRef(0);

  const activeCount = useMemo(
    () => employees.filter((employee) => isEmployeeActive(employee.status)).length,
    [employees],
  );

  const getEmployeeById = useCallback(
    (id: string) => employees.find((employee) => employee.id === id),
    [employees],
  );

  const reloadEmployees = useCallback(async () => {
    if (isDemoMode) {
      setEmployees(cloneDemoEmployees());
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!business?.id) {
      setEmployees([]);
      setIsLoading(isBusinessLoading);
      setError(businessError);
      return;
    }

    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    const { data, error: loadError } = await listEmployeesByBusiness(business.id);

    if (loadRequestIdRef.current !== requestId) return;

    if (loadError) {
      setError(loadError.message);
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    setEmployees(data);
    setIsLoading(false);
    setError(null);
  }, [business?.id, businessError, isBusinessLoading, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      setEmployees(cloneDemoEmployees());
      setIsLoading(false);
      setError(null);
      return;
    }

    if (isBusinessLoading) {
      setIsLoading(true);
      setError(null);
      return;
    }

    if (businessError) {
      setEmployees([]);
      setIsLoading(false);
      setError(businessError);
      return;
    }

    if (!business?.id) {
      setEmployees([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    void reloadEmployees();
  }, [business?.id, businessError, isBusinessLoading, isDemoMode, reloadEmployees]);

  const addEmployee = useCallback(
    async (input: NewEmployeeInput): Promise<AddEmployeeResult> => {
      if (isSubmitting) return { success: false, reason: 'busy' };

      const trimmedName = input.name.trim();
      const trimmedRole = input.role.trim();

      if (!trimmedName || !trimmedRole || !input.hireDate.trim()) {
        return { success: false, reason: 'invalid' };
      }

      const status = normalizeActiveStatus(input.status);
      const willBeActive = isEmployeeActive(status);

      if (willBeActive && activeCount >= activeLimit) {
        return { success: false, reason: 'limit_reached' };
      }

      setIsSubmitting(true);

      try {
        if (isDemoMode) {
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
          return { success: true, employee };
        }

        if (!business?.id) {
          return {
            success: false,
            reason: 'unavailable',
            message: 'Empresa não carregada. Aguarde ou recarregue a página.',
          };
        }

        const { data, error: createError } = await createEmployee({
          businessId: business.id,
          name: trimmedName,
          role: trimmedRole,
          status,
          baseSalary: input.baseSalary,
          hireDate: input.hireDate,
          phone: input.phone,
          email: input.email,
        });

        if (createError || !data) {
          return {
            success: false,
            reason: 'error',
            message: createError?.message ?? 'Não foi possível salvar o funcionário.',
          };
        }

        const employee: Employee = {
          ...data,
          avatarColor: AVATAR_COLORS[employees.length % AVATAR_COLORS.length],
        };

        setEmployees((current) =>
          [...current, employee].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
        );

        return { success: true, employee };
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeCount, activeLimit, business?.id, employees, isDemoMode, isSubmitting],
  );

  const updateEmployeeDetails = useCallback(
    async (id: string, input: EmployeeDetailsInput): Promise<EmployeeMutationResult> => {
      const current = employees.find((employee) => employee.id === id);
      if (!current) {
        return { success: false, message: 'Funcionário não encontrado.' };
      }

      const trimmedName = input.name.trim();
      const trimmedRole = input.role.trim();
      const trimmedPhone = input.phone?.trim() ?? '';
      const trimmedEmail = input.email?.trim() ?? '';

      if (!trimmedName || !trimmedRole) {
        return { success: false, message: 'Preencha nome e cargo antes de salvar.' };
      }

      if (!Number.isFinite(input.baseSalary) || input.baseSalary < 0) {
        return { success: false, message: 'Informe um salário base válido.' };
      }

      if (isDemoMode) {
        const salaryChanged = current.baseSalary !== input.baseSalary;
        setEmployees((list) =>
          list.map((employee) => {
            if (employee.id !== id) return employee;
            return {
              ...employee,
              name: trimmedName,
              role: trimmedRole,
              baseSalary: input.baseSalary,
              hireDate: input.hireDate,
              phone: trimmedPhone || undefined,
              email: trimmedEmail || undefined,
              initials: buildInitials(trimmedName),
              salaryHistory: salaryChanged
                ? [...employee.salaryHistory, { salary: input.baseSalary, effectiveDate: getLocalTodayIso() }]
                : employee.salaryHistory,
            };
          }),
        );
        return { success: true };
      }

      const { data, error: updateError } = await updateEmployee(id, {
        name: trimmedName,
        role: trimmedRole,
        baseSalary: input.baseSalary,
        hireDate: input.hireDate,
        phone: trimmedPhone || null,
        email: trimmedEmail || null,
      });

      if (updateError || !data) {
        return {
          success: false,
          message: updateError?.message ?? 'Não foi possível salvar as alterações.',
        };
      }

      const salaryChanged = current.baseSalary !== data.baseSalary;
      setEmployees((list) =>
        list.map((employee) => {
          if (employee.id !== id) return employee;
          return {
            ...data,
            avatarColor: employee.avatarColor,
            salaryHistory: salaryChanged
              ? [...employee.salaryHistory, { salary: data.baseSalary, effectiveDate: getLocalTodayIso() }]
              : employee.salaryHistory,
          };
        }),
      );

      return { success: true };
    },
    [employees, isDemoMode],
  );

  const deactivateEmployee = useCallback(
    async (id: string): Promise<EmployeeMutationResult> => {
      const current = employees.find((employee) => employee.id === id);
      if (!current) {
        return { success: false, message: 'Funcionário não encontrado.' };
      }

      if (!isEmployeeActive(current.status)) {
        return { success: false, message: 'Este funcionário já está inativo.' };
      }

      if (isDemoMode) {
        setEmployees((list) =>
          list.map((employee) => {
            if (employee.id !== id) return employee;
            const inactiveStatus: EmployeeStatus =
              employee.status === 'Ativa' ? 'Inativa' : 'Inativo';
            return {
              ...employee,
              status: inactiveStatus,
              inactiveDate: new Date().toISOString().slice(0, 10),
            };
          }),
        );
        return { success: true };
      }

      const { data, error: deactivateError } = await deactivateEmployeeRecord(id, current.status);

      if (deactivateError || !data) {
        return {
          success: false,
          message: deactivateError?.message ?? 'Não foi possível desativar o funcionário.',
        };
      }

      setEmployees((list) =>
        list.map((employee) =>
          employee.id === id
            ? { ...employee, ...data, avatarColor: employee.avatarColor, salaryHistory: employee.salaryHistory }
            : employee,
        ),
      );

      return { success: true };
    },
    [employees, isDemoMode],
  );

  const reactivateEmployee = useCallback(
    async (id: string): Promise<EmployeeMutationResult> => {
      const current = employees.find((employee) => employee.id === id);
      if (!current) {
        return { success: false, message: 'Funcionário não encontrado.' };
      }

      if (isEmployeeActive(current.status)) {
        return { success: false, message: 'Este funcionário já está ativo.' };
      }

      if (activeCount >= activeLimit) {
        return { success: false, message: 'Você atingiu o limite de funcionários ativos do plano.' };
      }

      if (isDemoMode) {
        setEmployees((list) =>
          list.map((employee) => {
            if (employee.id !== id) return employee;
            const activeStatus: EmployeeStatus = employee.status === 'Inativa' ? 'Ativa' : 'Ativo';
            return {
              ...employee,
              status: activeStatus,
              inactiveDate: undefined,
            };
          }),
        );
        return { success: true };
      }

      const { data, error: reactivateError } = await reactivateEmployeeRecord(id, current.status);

      if (reactivateError || !data) {
        return {
          success: false,
          message: reactivateError?.message ?? 'Não foi possível reativar o funcionário.',
        };
      }

      setEmployees((list) =>
        list.map((employee) =>
          employee.id === id
            ? {
                ...employee,
                ...data,
                avatarColor: employee.avatarColor,
                salaryHistory: employee.salaryHistory,
                inactiveDate: data.inactiveDate,
              }
            : employee,
        ),
      );

      return { success: true };
    },
    [activeCount, activeLimit, employees, isDemoMode],
  );

  const countEmployeeMovements = useCallback(
    async (id: string): Promise<{ count: number | null; message?: string }> => {
      if (isDemoMode) {
        return { count: 0 };
      }

      if (!business?.id) {
        return { count: null, message: 'Empresa não carregada. Aguarde ou recarregue a página.' };
      }

      const { count, error: countError } = await countMovementsForEmployee(business.id, id);

      if (countError || count === null) {
        return {
          count: null,
          message: countError?.message ?? 'Não foi possível verificar o histórico financeiro.',
        };
      }

      return { count };
    },
    [business?.id, isDemoMode],
  );

  const removeEmployee = useCallback(
    async (id: string, hasLocalFinancialHistory = false): Promise<EmployeeMutationResult> => {
      const current = employees.find((employee) => employee.id === id);
      if (!current) {
        return { success: false, message: 'Funcionário não encontrado.' };
      }

      if (hasLocalFinancialHistory) {
        return { success: false, message: EMPLOYEE_LINKED_HISTORY_MESSAGE };
      }

      if (isDemoMode) {
        setEmployees((list) => list.filter((employee) => employee.id !== id));
        return { success: true };
      }

      const { count, message } = await countEmployeeMovements(id);
      if (count === null) {
        return { success: false, message: message ?? 'Não foi possível verificar o histórico financeiro.' };
      }

      if (count > 0) {
        return { success: false, message: EMPLOYEE_LINKED_HISTORY_MESSAGE };
      }

      return { success: false, message: EMPLOYEE_DELETE_BLOCKED_MESSAGE };
    },
    [countEmployeeMovements, employees, isDemoMode],
  );

  const updateEmployeeSalary = useCallback(
    async (id: string, salary: number, effectiveDate: string) => {
      const current = employees.find((employee) => employee.id === id);
      if (!current) return;

      if (isDemoMode) {
        setEmployees((list) =>
          list.map((employee) => {
            if (employee.id !== id) return employee;
            return {
              ...employee,
              baseSalary: salary,
              salaryHistory: [...employee.salaryHistory, { salary, effectiveDate }],
            };
          }),
        );
        return;
      }

      const { data, error: updateError } = await updateEmployee(id, { baseSalary: salary });

      if (updateError || !data) {
        setError(updateError?.message ?? 'Não foi possível atualizar o salário.');
        return;
      }

      setEmployees((list) =>
        list.map((employee) => {
          if (employee.id !== id) return employee;
          return {
            ...data,
            avatarColor: employee.avatarColor,
            salaryHistory: [...employee.salaryHistory, { salary, effectiveDate }],
          };
        }),
      );
    },
    [employees, isDemoMode],
  );

  const value = useMemo(
    () => ({
      employees,
      activeCount,
      isLoading,
      error,
      isSubmitting,
      isDemoMode,
      reloadEmployees,
      addEmployee,
      updateEmployeeDetails,
      deactivateEmployee,
      reactivateEmployee,
      removeEmployee,
      countEmployeeMovements,
      updateEmployeeSalary,
      getEmployeeById,
    }),
    [
      employees,
      activeCount,
      isLoading,
      error,
      isSubmitting,
      isDemoMode,
      reloadEmployees,
      addEmployee,
      updateEmployeeDetails,
      deactivateEmployee,
      reactivateEmployee,
      removeEmployee,
      countEmployeeMovements,
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
