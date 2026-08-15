import { useCallback, useEffect, useState } from 'react';

import { useAppData } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';

const PDF_EXPORT_DELAY_MS = 1500;
export const PDF_EXPORT_SUCCESS_MESSAGE = 'PDF exportado com sucesso';

export function useSimulatedPdfExport() {
  const { isPro } = usePlan();
  const { openProFeature } = useAppData();
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const exportPdf = useCallback(() => {
    if (!isPro) {
      openProFeature('export_pdf');
      return;
    }

    if (isExporting) return;

    setIsExporting(true);
    setSuccessMessage(null);

    setTimeout(() => {
      setIsExporting(false);
      setSuccessMessage(PDF_EXPORT_SUCCESS_MESSAGE);
    }, PDF_EXPORT_DELAY_MS);
  }, [isExporting, isPro, openProFeature]);

  return { exportPdf, isExporting, successMessage };
}
