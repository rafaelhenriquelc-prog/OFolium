export const CURRENT_COMPETENCE = '2026-08';

export const DEMO_TODAY = '2026-08-14';

/** Histórico consultável no plano Base, contado a partir do mês atual. */
export const BASE_HISTORY_MONTHS = 3;

export function getCalendarCompetence(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function addMonthsToCompetence(competence: string, amount: number): string {
  const [year, month] = competence.split('-').map(Number);
  return getCalendarCompetence(new Date(year, month - 1 + amount, 1));
}

export function competenceIndex(competence: string): number {
  const [year, month] = competence.split('-').map(Number);
  return year * 12 + month;
}

export function isCompetenceInBaseHistory(
  competence: string,
  reference = getCalendarCompetence(),
): boolean {
  const diff = competenceIndex(reference) - competenceIndex(competence);
  return diff >= 0 && diff < BASE_HISTORY_MONTHS;
}

export function isDateWithinPlanHistory(
  dateStr: string,
  isPro: boolean,
  reference = getCalendarCompetence(),
): boolean {
  if (isPro) return true;
  const competence = dateStr.slice(0, 7);
  if (competenceIndex(competence) > competenceIndex(reference)) return true;
  return isCompetenceInBaseHistory(competence, reference);
}

export function competenceToLabel(competence: string): string {
  const [year, month] = competence.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getCompetenceFromDate(date: string): string {
  return date.slice(0, 7);
}

export function isWithinLastMonths(competence: string, months: number, reference = CURRENT_COMPETENCE): boolean {
  const [refYear, refMonth] = reference.split('-').map(Number);
  const [year, month] = competence.split('-').map(Number);
  const refIndex = refYear * 12 + refMonth;
  const targetIndex = year * 12 + month;
  return refIndex - targetIndex < months;
}

export function formatWeekRange(startDay: number, endDay: number, competence = CURRENT_COMPETENCE): string {
  const label = competenceToLabel(competence).split(' de ')[0];
  return `${startDay} – ${endDay} de ${label.toLowerCase()}`;
}
