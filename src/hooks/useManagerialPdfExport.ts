import { useCallback, useEffect, useState } from 'react';

import { useAppData } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';
import { downloadManagerialPdf } from '@/utils/downloadManagerialPdf';
import {
  PDF_EXPORT_EMPTY_MESSAGE,
  PDF_EXPORT_FAILURE_MESSAGE,
  PDF_EXPORT_SUCCESS_MESSAGE,
  type ManagerialPdfInput,
} from '@/utils/managerialPdf';

export function useManagerialPdfExport() {
  const { isPro } = usePlan();
  const { openProFeature } = useAppData();
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [errorMessage, successMessage]);

  const exportPdf = useCallback(
    (input: ManagerialPdfInput) => {
      if (!isPro) {
        openProFeature('export_pdf');
        return;
      }

      if (isExporting) return;

      if (input.rows.length === 0) {
        setSuccessMessage(null);
        setErrorMessage(PDF_EXPORT_EMPTY_MESSAGE);
        return;
      }

      setIsExporting(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      try {
        const result = downloadManagerialPdf(input);
        if (!result.ok) {
          setErrorMessage(result.message);
          return;
        }
        setSuccessMessage(PDF_EXPORT_SUCCESS_MESSAGE);
      } catch {
        setErrorMessage(PDF_EXPORT_FAILURE_MESSAGE);
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, isPro, openProFeature],
  );

  return { exportPdf, isExporting, successMessage, errorMessage };
}
