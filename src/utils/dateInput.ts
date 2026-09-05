export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidIsoDate(iso: string): boolean {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

export function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type HireDateValidationResult =
  | { ok: true; iso: string }
  | { ok: false; error: string };

export function validateHireDateInput(
  value: string,
  todayIso = getLocalTodayIso(),
): HireDateValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: 'Informe a data de admissão.' };
  }

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!brMatch) {
    return { ok: false, error: 'Informe uma data de admissão válida.' };
  }

  const iso = `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  if (!isValidIsoDate(iso)) {
    return { ok: false, error: 'Informe uma data de admissão válida.' };
  }

  if (iso > todayIso) {
    return { ok: false, error: 'A data de admissão não pode ser futura.' };
  }

  return { ok: true, iso };
}

export function parseDateInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const iso = `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    return isValidIsoDate(iso) ? iso : null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && isValidIsoDate(trimmed)) {
    return trimmed;
  }

  return null;
}

export function formatHireDate(value: string | undefined | null): string {
  const iso = parseDateInputToIso(value ?? '');
  if (!iso) return 'Não informada';

  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function isoToDateInput(value: string): string {
  const iso = parseDateInputToIso(value);
  if (!iso) return '';

  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
