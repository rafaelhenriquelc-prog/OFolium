import {
  PDF_EXPORT_UNSUPPORTED_MESSAGE,
  type ManagerialPdfInput,
  type ManagerialPdfResult,
} from '@/utils/managerialPdf';

export function downloadManagerialPdf(_input: ManagerialPdfInput): ManagerialPdfResult {
  return { ok: false, message: PDF_EXPORT_UNSUPPORTED_MESSAGE };
}
