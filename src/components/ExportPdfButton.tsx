import { Button } from '@/components/ui/Button';
import { ProLockedButton } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';

type ExportPdfButtonProps = {
  onExport: () => void;
  isExporting: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  fullWidth?: boolean;
};

const EXPORT_PDF_LABEL = 'Exportar demonstrativo em PDF';

export function ExportPdfButton({
  onExport,
  isExporting,
  variant = 'outline',
  fullWidth,
}: ExportPdfButtonProps) {
  const { isPro } = usePlan();

  if (!isPro) {
    return (
      <ProLockedButton label={EXPORT_PDF_LABEL} feature="export_pdf" fullWidth={fullWidth} />
    );
  }

  return (
    <Button
      label={EXPORT_PDF_LABEL}
      variant={variant}
      fullWidth={fullWidth}
      loading={isExporting}
      loadingLabel="Exportando..."
      onPress={onExport}
    />
  );
}
