export type ManagerialPdfRow = {
  employeeName: string;
  role: string;
  forecast: number;
};

export type ManagerialPdfInput = {
  companyName?: string | null;
  competence: string;
  competenceLabel: string;
  generatedAt: Date;
  rows: ManagerialPdfRow[];
  totalForecast: number;
};

export type ManagerialPdfResult = { ok: true } | { ok: false; message: string };

export const PDF_EXPORT_SUCCESS_MESSAGE = 'PDF exportado com sucesso';
export const PDF_EXPORT_EMPTY_MESSAGE = 'Não há dados para exportar neste demonstrativo.';
export const PDF_EXPORT_UNSUPPORTED_MESSAGE = 'A exportação em PDF está disponível na versão web.';
export const PDF_EXPORT_FAILURE_MESSAGE = 'Não foi possível gerar o PDF. Tente novamente.';

export function managerialPdfFileName(competence: string): string {
  const safeCompetence = competence.replace(/[^\d-]/g, '') || 'competencia';
  return `OFolium_Demonstrativo_${safeCompetence}.pdf`;
}
