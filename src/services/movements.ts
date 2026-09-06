import { supabase } from '@/lib/supabase';
import type { AbsenceSubtype, Movement, RecordType } from '@/data/types';
import { valueToDecimalHours } from '@/utils/activityFromMovements';
import { parseDateInputToIso } from '@/utils/dateInput';
import { parseCurrencyInput } from '@/utils/masks';

type MovementRow = {
  id: string;
  business_id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  movement_date: string;
  competence: string;
  value: string;
  amount: number | string | null;
  hours: number | string | null;
  description: string | null;
  absence_subtype: string | null;
  estimated_discount: boolean | null;
  formula: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseErrorLike = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type CreateMovementInput = {
  businessId: string;
  employeeId: string;
  employeeName: string;
  type: RecordType;
  occurrenceDate: string;
  competence: string;
  value: string;
  amount?: number;
  notes?: string;
  absenceSubtype?: AbsenceSubtype;
  estimatedDiscount?: boolean;
  formula?: string;
};

export type UpdateMovementInput = {
  type?: RecordType;
  occurrenceDate?: string;
  competence?: string;
  value?: string;
  amount?: number | null;
  notes?: string | null;
  absenceSubtype?: AbsenceSubtype | null;
  estimatedDiscount?: boolean | null;
  formula?: string | null;
};

export type MovementsServiceError = {
  message: string;
  code?: string;
};

const MOVEMENT_SELECT =
  'id, business_id, employee_id, employee_name, type, movement_date, competence, value, amount, hours, description, absence_subtype, estimated_discount, formula, created_at, updated_at';

const RECORD_TYPES: RecordType[] = ['Hora extra', 'Falta', 'Vale', 'Adicional', 'Desconto'];
const MONETARY_TYPES: RecordType[] = ['Vale', 'Adicional', 'Desconto'];

function parseNumeric(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRecordType(value: string): value is RecordType {
  return RECORD_TYPES.includes(value as RecordType);
}

function isAbsenceSubtype(value: string): value is AbsenceSubtype {
  return (
    value === 'Falta injustificada' ||
    value === 'Falta justificada' ||
    value === 'Atestado' ||
    value === 'Atraso' ||
    value === 'Saída antecipada'
  );
}

function isMonetaryType(type: RecordType): boolean {
  return MONETARY_TYPES.includes(type);
}

function normalizeOccurrenceDate(value: string): string | null {
  return parseDateInputToIso(value);
}

function normalizeCompetence(occurrenceDate: string, competence?: string): string | null {
  const normalizedCompetence = competence?.trim();
  if (normalizedCompetence && /^\d{4}-\d{2}$/.test(normalizedCompetence)) {
    return normalizedCompetence;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) return null;
  return occurrenceDate.slice(0, 7);
}

function resolveMonetaryAmount(input: { value: string; amount?: number }): number | null {
  if (
    typeof input.amount === 'number' &&
    Number.isFinite(input.amount) &&
    input.amount > 0
  ) {
    return Math.round(input.amount * 100) / 100;
  }

  const parsedFromValue = parseCurrencyInput(input.value);
  if (parsedFromValue !== null && parsedFromValue > 0) {
    return parsedFromValue;
  }

  return null;
}

function resolveOptionalAmount(amount?: number | null): number | null {
  if (amount === undefined || amount === null) return null;
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
}

function translateMovementsError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'Você não tem permissão para acessar estas movimentações.';
  }

  if (normalized.includes('employee_id does not belong')) {
    return 'Funcionário não pertence à sua empresa.';
  }

  if (normalized.includes('violates check constraint')) {
    return 'Dados inválidos para este tipo de movimentação.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}

function logSupabaseError(operation: string, error: SupabaseErrorLike): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;

  console.warn(`[movements] ${operation} failed`, {
    code: error.code ?? 'unknown',
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function mapRowToMovement(row: MovementRow): Movement {
  const type: RecordType = isRecordType(row.type) ? row.type : 'Vale';

  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    type,
    occurrenceDate: row.movement_date,
    competence: row.competence,
    value: row.value,
    amount: parseNumeric(row.amount),
    notes: row.description ?? undefined,
    absenceSubtype:
      row.absence_subtype && isAbsenceSubtype(row.absence_subtype)
        ? row.absence_subtype
        : undefined,
    estimatedDiscount: row.estimated_discount ?? undefined,
    formula: row.formula ?? undefined,
    createdAt: row.created_at,
  };
}

function buildInsertPayload(
  input: CreateMovementInput,
): { payload: Record<string, unknown>; error: MovementsServiceError | null } {
  const occurrenceDate = normalizeOccurrenceDate(input.occurrenceDate);
  if (!occurrenceDate) {
    return {
      payload: {},
      error: { message: 'Informe uma data válida.', code: 'invalid_date' },
    };
  }

  const competence = normalizeCompetence(occurrenceDate, input.competence);
  if (!competence) {
    return {
      payload: {},
      error: { message: 'Competência inválida para a data informada.', code: 'invalid_competence' },
    };
  }

  const trimmedValue = input.value.trim();
  if (!trimmedValue) {
    return {
      payload: {},
      error: { message: 'Informe o valor ou duração do registro.', code: 'invalid_value' },
    };
  }

  let amount: number | null = null;
  let hours: number | null = null;

  if (isMonetaryType(input.type)) {
    amount = resolveMonetaryAmount(input);
    if (amount === null) {
      return {
        payload: {},
        error: { message: 'Informe um valor válido.', code: 'invalid_amount' },
      };
    }
  } else if (input.type === 'Hora extra') {
    hours = valueToDecimalHours(trimmedValue);
    if (hours === null) {
      return {
        payload: {},
        error: { message: 'Informe uma duração válida.', code: 'invalid_hours' },
      };
    }
    amount = resolveOptionalAmount(input.amount);
  } else {
    amount = resolveOptionalAmount(input.amount);
  }

  return {
    payload: {
      business_id: input.businessId,
      employee_id: input.employeeId,
      employee_name: input.employeeName.trim(),
      type: input.type,
      movement_date: occurrenceDate,
      competence,
      value: trimmedValue,
      amount,
      hours,
      description: input.notes?.trim() || null,
      absence_subtype: input.absenceSubtype ?? null,
      estimated_discount: input.estimatedDiscount ?? null,
      formula: input.formula ?? null,
    },
    error: null,
  };
}

export async function listMovementsByBusiness(
  businessId: string,
): Promise<{ data: Movement[]; error: MovementsServiceError | null }> {
  const { data, error } = await supabase
    .from('movements')
    .select(MOVEMENT_SELECT)
    .eq('business_id', businessId)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('listMovementsByBusiness', error);
    return { data: [], error: { message: translateMovementsError(error.message), code: error.code } };
  }

  return { data: (data as MovementRow[]).map(mapRowToMovement), error: null };
}

export async function listMovementsByEmployee(
  businessId: string,
  employeeId: string,
): Promise<{ data: Movement[]; error: MovementsServiceError | null }> {
  const { data, error } = await supabase
    .from('movements')
    .select(MOVEMENT_SELECT)
    .eq('business_id', businessId)
    .eq('employee_id', employeeId)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('listMovementsByEmployee', error);
    return { data: [], error: { message: translateMovementsError(error.message), code: error.code } };
  }

  return { data: (data as MovementRow[]).map(mapRowToMovement), error: null };
}

export async function createMovement(
  input: CreateMovementInput,
): Promise<{ data: Movement | null; error: MovementsServiceError | null }> {
  const { payload, error: validationError } = buildInsertPayload(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const { data, error } = await supabase
    .from('movements')
    .insert(payload)
    .select(MOVEMENT_SELECT)
    .single();

  if (error) {
    logSupabaseError('createMovement', error);
    return { data: null, error: { message: translateMovementsError(error.message), code: error.code } };
  }

  return { data: mapRowToMovement(data as MovementRow), error: null };
}

export async function updateMovementRecord(
  movementId: string,
  businessId: string,
  patch: UpdateMovementInput,
): Promise<{ data: Movement | null; error: MovementsServiceError | null }> {
  const payload: Record<string, unknown> = {};
  const nextType = patch.type;

  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.occurrenceDate !== undefined) {
    const occurrenceDate = normalizeOccurrenceDate(patch.occurrenceDate);
    if (!occurrenceDate) {
      return { data: null, error: { message: 'Informe uma data válida.', code: 'invalid_date' } };
    }
    payload.movement_date = occurrenceDate;
  }
  if (patch.competence !== undefined) {
    const movementDate =
      typeof payload.movement_date === 'string'
        ? payload.movement_date
        : patch.occurrenceDate
          ? normalizeOccurrenceDate(patch.occurrenceDate)
          : null;
    const competence = movementDate ? normalizeCompetence(movementDate, patch.competence) : patch.competence.trim();
    if (!competence || !/^\d{4}-\d{2}$/.test(competence)) {
      return {
        data: null,
        error: { message: 'Competência inválida para a data informada.', code: 'invalid_competence' },
      };
    }
    payload.competence = competence;
  }
  if (patch.value !== undefined) {
    const trimmedValue = patch.value.trim();
    if (!trimmedValue) {
      return { data: null, error: { message: 'Informe o valor ou duração do registro.', code: 'invalid_value' } };
    }
    payload.value = trimmedValue;

    const effectiveType = nextType ?? (typeof payload.type === 'string' ? payload.type : undefined);
    if (effectiveType === 'Hora extra' || payload.type === 'Hora extra') {
      payload.hours = valueToDecimalHours(trimmedValue);
    }
  }
  if (patch.amount !== undefined) payload.amount = resolveOptionalAmount(patch.amount);
  if (nextType && isMonetaryType(nextType) && patch.value !== undefined) {
    const monetaryAmount = resolveMonetaryAmount({
      value: patch.value,
      amount: patch.amount ?? undefined,
    });
    if (monetaryAmount === null) {
      return { data: null, error: { message: 'Informe um valor válido.', code: 'invalid_amount' } };
    }
    payload.amount = monetaryAmount;
  }
  if (patch.notes !== undefined) payload.description = patch.notes?.trim() || null;
  if (patch.absenceSubtype !== undefined) payload.absence_subtype = patch.absenceSubtype;
  if (patch.estimatedDiscount !== undefined) payload.estimated_discount = patch.estimatedDiscount;
  if (patch.formula !== undefined) payload.formula = patch.formula;

  const { data, error } = await supabase
    .from('movements')
    .update(payload)
    .eq('id', movementId)
    .eq('business_id', businessId)
    .select(MOVEMENT_SELECT)
    .single();

  if (error) {
    logSupabaseError('updateMovementRecord', error);
    return { data: null, error: { message: translateMovementsError(error.message), code: error.code } };
  }

  return { data: mapRowToMovement(data as MovementRow), error: null };
}

export async function deleteMovementRecord(
  movementId: string,
  businessId: string,
): Promise<{ error: MovementsServiceError | null }> {
  const { error } = await supabase
    .from('movements')
    .delete()
    .eq('id', movementId)
    .eq('business_id', businessId);

  if (error) {
    logSupabaseError('deleteMovementRecord', error);
    return { error: { message: translateMovementsError(error.message), code: error.code } };
  }

  return { error: null };
}
