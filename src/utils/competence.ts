export const CURRENT_COMPETENCE = '2026-08';

export const DEMO_TODAY = '2026-08-14';

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
