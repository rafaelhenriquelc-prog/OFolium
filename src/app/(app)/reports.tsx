import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExportPdfButton } from '@/components/ExportPdfButton';
import { Screen } from '@/components/mobile/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HorizontalTableScroll } from '@/components/ui/HorizontalTableScroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/StatCard';
import { BrandColors } from '@/constants/colors';
import { STAT_ICONS } from '@/constants/statIcons';
import { MOBILE_STAT_CARD_WIDTH, MobileSpace } from '@/constants/layout';
import { ProLockedButton, useAppData } from '@/contexts/AppDataContext';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useSimulatedPdfExport } from '@/hooks/useSimulatedPdfExport';
import { MANAGERIAL_DISCLAIMER } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';

export default function ReportsScreen() {
  const { isPro } = usePlan();
  const { isCompactLayout } = useResponsiveLayout();
  const { exportPdf, isExporting, successMessage } = useSimulatedPdfExport();
  const {
    competenceLabel,
    closingSummaries,
    totalForecast,
    overtimeHours,
    valesTotal,
    absenceCount,
    isCompetenceClosed,
    ProFeatureModalHost,
  } = useAppData();

  const stats = (
    <>
      <StatCard
        label="Total previsto"
        value={formatCurrency(totalForecast)}
        detail="Valor gerencial previsto"
        iconImage={STAT_ICONS.previsaoDoMes}
        iconBg={BrandColors.blueLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Horas extras"
        value={overtimeHours}
        iconImage={STAT_ICONS.horasExtras}
        iconBg={BrandColors.amberLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Vales"
        value={formatCurrency(valesTotal)}
        iconImage={STAT_ICONS.vales}
        iconBg={BrandColors.blueLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Faltas"
        value={String(absenceCount)}
        iconImage={STAT_ICONS.faltas}
        iconBg={BrandColors.redLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
    </>
  );

  return (
    <Screen>
      <PageHeader
        title="Relatórios"
        subtitle="Visualize e exporte dados da sua equipe."
        action={<ExportPdfButton onExport={exportPdf} isExporting={isExporting} />}
      />

      {successMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <View style={[styles.filters, isCompactLayout && styles.filtersCompact]}>
        <FilterField label="Funcionário" value="Todos" compact={isCompactLayout} />
        <FilterField label="Período" value={competenceLabel} compact={isCompactLayout} />
        <FilterField label="Tipo de registro" value="Todos" compact={isCompactLayout} />
      </View>

      {isCompactLayout ? (
        <View style={styles.statsCarouselWrap}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsRowMobile}
            style={styles.statsScroll}>
            {stats}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.statsRow}>{stats}</View>
      )}

      <Card>
        <Text style={styles.previewTitle}>
          {isCompetenceClosed ? 'Demonstrativo gerencial' : 'Prévia do demonstrativo gerencial'}
        </Text>
        <Text style={styles.previewSubtitle}>{competenceLabel} — Funcionários ativos</Text>
        <Text style={styles.disclaimer}>{MANAGERIAL_DISCLAIMER}</Text>

        <HorizontalTableScroll minTableWidth={560}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewCol, styles.colName]}>Funcionário</Text>
            <Text style={[styles.previewCol, styles.colRole]}>Cargo</Text>
            <Text style={[styles.previewCol, styles.colValue]}>Previsão</Text>
          </View>

          {closingSummaries.map((employee, index) => (
            <View
              key={employee.employeeId}
              style={[styles.previewRow, index < closingSummaries.length - 1 && styles.previewRowBorder]}>
              <Text style={[styles.previewCol, styles.colName, styles.previewName]}>
                {employee.employeeName}
              </Text>
              <Text style={[styles.previewCol, styles.colRole]}>{employee.role}</Text>
              <Text style={[styles.previewCol, styles.colValue, styles.previewValue]}>
                {formatCurrency(employee.forecast)}
              </Text>
            </View>
          ))}
        </HorizontalTableScroll>

        <View style={styles.previewFooter}>
          <Text style={styles.previewFooterLabel}>Total previsto</Text>
          <Text style={styles.previewFooterValue}>{formatCurrency(totalForecast)}</Text>
        </View>

        <View style={styles.exportActions}>
          <ExportPdfButton onExport={exportPdf} isExporting={isExporting} fullWidth variant="primary" />
          {isPro ? (
            <Button label="Exportar Excel/CSV" variant="outline" fullWidth onPress={() => {}} />
          ) : (
            <ProLockedButton label="Exportar Excel/CSV" feature="export_spreadsheet" fullWidth />
          )}
        </View>
      </Card>

      <ProFeatureModalHost />
    </Screen>
  );
}

function FilterField({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.filterField, compact && styles.filterFieldCompact]}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={[styles.filterValue, compact && styles.filterValueCompact]}>
        <Text style={styles.filterValueText} numberOfLines={compact ? 2 : 1}>
          {value}
        </Text>
        <Text style={styles.filterChevron}>▾</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: BrandColors.greenLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.green,
  },
  filters: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filtersCompact: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
  },
  filterField: {
    gap: 6,
    minWidth: 160,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
  },
  filterFieldCompact: {
    width: '100%',
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
  },
  filterLabel: { fontSize: 12, fontWeight: '600', color: BrandColors.textMuted },
  filterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 180,
    gap: 8,
  },
  filterValueCompact: {
    minWidth: 0,
    width: '100%',
  },
  filterValueText: { fontSize: 14, color: BrandColors.textPrimary, flex: 1, minWidth: 0 },
  filterChevron: { fontSize: 12, color: BrandColors.textMuted, flexShrink: 0 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  statsCarouselWrap: {
    width: '100%',
    marginBottom: MobileSpace.section,
    ...(Platform.OS === 'web' ? ({ overflow: 'visible' } as object) : {}),
  },
  statsScroll: {
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        } as object)
      : {}),
  },
  statsRowMobile: {
    flexDirection: 'row',
    gap: MobileSpace.cardGap,
    paddingRight: 4,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.textPrimary, marginBottom: 4 },
  previewSubtitle: { fontSize: 13, color: BrandColors.textSecondary, marginBottom: 8 },
  disclaimer: { fontSize: 12, lineHeight: 18, color: BrandColors.textMuted, marginBottom: 16 },
  previewHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    marginBottom: 4,
    minWidth: 520,
  },
  previewCol: { fontSize: 12, fontWeight: '600', color: BrandColors.textMuted, textTransform: 'uppercase' },
  colName: { flex: 2, minWidth: 180 },
  colRole: { flex: 1, minWidth: 100 },
  colValue: { flex: 1, minWidth: 100, textAlign: 'right' },
  previewRow: { flexDirection: 'row', paddingVertical: 12, minWidth: 520 },
  previewRowBorder: { borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
  previewName: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary, textTransform: 'none' },
  previewValue: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary, textTransform: 'none' },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
  },
  previewFooterLabel: { fontSize: 14, fontWeight: '700', color: BrandColors.textPrimary },
  previewFooterValue: { fontSize: 16, fontWeight: '700', color: BrandColors.orange },
  exportActions: { gap: 12, marginTop: 20 },
});
