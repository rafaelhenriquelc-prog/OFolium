import type { Employee } from '@/data/types';

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesEmployeeQuery(employee: Employee, query: string): boolean {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;

  return [employee.name, employee.role, employee.email, employee.phone]
    .filter((field): field is string => Boolean(field))
    .some((field) => normalizeSearch(field).includes(normalized));
}
