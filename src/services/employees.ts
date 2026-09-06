import { supabase } from '@/lib/supabase';
import type { Employee, EmployeeStatus } from '@/data/types';

/** Linha retornada pelo Supabase (snake_case). */
type EmployeeRow = {
  id: string;
  business_id: string;
  name: string;
  role: string;
  status: string;
  base_salary: number | string;
  hire_date: string;
  inactive_date: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateEmployeeInput = {
  businessId: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  baseSalary: number;
  hireDate: string;
  phone?: string;
  email?: string;
};

export type UpdateEmployeeInput = {
  name?: string;
  role?: string;
  status?: EmployeeStatus;
  baseSalary?: number;
  hireDate?: string;
  inactiveDate?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type EmployeesServiceError = {
  message: string;
  code?: string;
};

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

function parseNumeric(value: number | string): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isEmployeeStatus(value: string): value is EmployeeStatus {
  return value === 'Ativo' || value === 'Ativa' || value === 'Inativo' || value === 'Inativa';
}

function translateEmployeesError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'Você não tem permissão para acessar estes funcionários.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }

  if (normalized.includes('violates check constraint')) {
    return 'Dados inválidos. Verifique os campos e tente novamente.';
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}

function mapRowToEmployee(row: EmployeeRow, index: number): Employee {
  const status: EmployeeStatus = isEmployeeStatus(row.status) ? row.status : 'Ativo';
  const baseSalary = parseNumeric(row.base_salary);

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    status,
    baseSalary,
    hireDate: row.hire_date,
    inactiveDate: row.inactive_date ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    initials: buildInitials(row.name),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    salaryHistory: [{ salary: baseSalary, effectiveDate: row.hire_date }],
  };
}

export async function listEmployeesByBusiness(
  businessId: string,
): Promise<{ data: Employee[]; error: EmployeesServiceError | null }> {
  const { data, error } = await supabase
    .from('employees')
    .select(
      'id, business_id, name, role, status, base_salary, hire_date, inactive_date, phone, email, created_at, updated_at',
    )
    .eq('business_id', businessId)
    .order('name', { ascending: true });

  if (error) {
    return { data: [], error: { message: translateEmployeesError(error.message), code: error.code } };
  }

  const rows = (data ?? []) as EmployeeRow[];
  return {
    data: rows.map((row, index) => mapRowToEmployee(row, index)),
    error: null,
  };
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<{ data: Employee | null; error: EmployeesServiceError | null }> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      business_id: input.businessId,
      name: input.name.trim(),
      role: input.role.trim(),
      status: input.status,
      base_salary: input.baseSalary,
      hire_date: input.hireDate,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    })
    .select(
      'id, business_id, name, role, status, base_salary, hire_date, inactive_date, phone, email, created_at, updated_at',
    )
    .single();

  if (error) {
    return { data: null, error: { message: translateEmployeesError(error.message), code: error.code } };
  }

  return { data: mapRowToEmployee(data as EmployeeRow, 0), error: null };
}

export async function updateEmployee(
  employeeId: string,
  patch: UpdateEmployeeInput,
): Promise<{ data: Employee | null; error: EmployeesServiceError | null }> {
  const payload: Record<string, unknown> = {};

  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.role !== undefined) payload.role = patch.role.trim();
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.baseSalary !== undefined) payload.base_salary = patch.baseSalary;
  if (patch.hireDate !== undefined) payload.hire_date = patch.hireDate;
  if (patch.inactiveDate !== undefined) payload.inactive_date = patch.inactiveDate;
  if (patch.phone !== undefined) payload.phone = patch.phone?.trim() || null;
  if (patch.email !== undefined) payload.email = patch.email?.trim() || null;

  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', employeeId)
    .select(
      'id, business_id, name, role, status, base_salary, hire_date, inactive_date, phone, email, created_at, updated_at',
    )
    .single();

  if (error) {
    return { data: null, error: { message: translateEmployeesError(error.message), code: error.code } };
  }

  return { data: mapRowToEmployee(data as EmployeeRow, 0), error: null };
}

export async function deactivateEmployeeRecord(
  employeeId: string,
  currentStatus: EmployeeStatus,
): Promise<{ data: Employee | null; error: EmployeesServiceError | null }> {
  const inactiveStatus: EmployeeStatus = currentStatus === 'Ativa' ? 'Inativa' : 'Inativo';
  const inactiveDate = new Date().toISOString().slice(0, 10);

  return updateEmployee(employeeId, {
    status: inactiveStatus,
    inactiveDate,
  });
}
