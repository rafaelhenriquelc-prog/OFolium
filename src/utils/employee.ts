import type { EmployeeStatus } from '@/data/types';

export function isEmployeeActive(status: EmployeeStatus): boolean {
  return status === 'Ativo' || status === 'Ativa';
}
