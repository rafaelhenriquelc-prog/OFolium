import { DEMO_EMAIL, IS_DEMO } from '@/constants/demo';

/** Conta dedicada à versão demonstrativa — usa dados locais, sem Supabase para RH. */
export function isDemoAccount(email: string | undefined | null): boolean {
  if (!IS_DEMO) return false;
  return (email?.trim().toLowerCase() ?? '') === DEMO_EMAIL.toLowerCase();
}
