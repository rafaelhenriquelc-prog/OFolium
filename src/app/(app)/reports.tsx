import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExportPdfButton } from '@/components/ExportPdfButton';
import { Screen } from '@/components/mobile/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { HorizontalTableScroll } from '@/components/ui/HorizontalTableScroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/StatCard';
import { BrandColors } from '@/constants/colors';
import { STAT_ICONS } from '@/constants/statIcons';
import { MOBILE_STAT_CARD_WIDTH, MobileSpace } from '@/constants/layout';
import { ProLockedButton, useAppData } from '@/contexts/AppDataContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useSimulatedPdfExport } from '@/hooks/useSimulatedPdfExport';
import { MANAGERIAL_DISCLAIMER } from '@/utils/calculations';
import { formatCurrency, formatShortDate } from '@/utils/format';
import {
  buildCompetenceFilterOptions,
  buildEmployeeFilterOptions,
  computeReportData,
  DEFAULT_REPORT_FILTERS,
  getAvailableCompetences,
  isReportFiltersDirty,
  REPORT_RECORD_TYPE_OPTIONS,
  type ReportFilters,
} from '@/utils/reports';

type ActiveFilterKey = 'employee' | 'period' | 'recordType';

export default function ReportsScreen() {
  const { isPro } = usePlan();
  const { isCompactLayout } = useResponsiveLayout();
  const { exportPdf, isExporting, successMessage } = useSimulatedPdfExport();
  const { employees } = useEmployees();
  const {
    movements,
    isCompetenceClosed,
    getMovementsForEmployee,
    ProFeatureModalHost,
  } = useAppData();

  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterKey | null>(null);

  const employeeOptions = useMemo(
    () => buildEmployeeFilterOptions(employees, movements, filters.competence),
    [employees, filters.competence, movements],
  );

  useEffect(() => {
    if (filters.employeeId === 'all') return;
    const stillAvailable = employeeOptions.some((option) => option.value === filters.employeeId);
    if (!stillAvailable) {
      setFilters((current) => ({ ...current, employeeId: 'all' }));
    }
  }, [employeeOptions, filters.employeeId]);
  const competenceOptions = useMemo(
    () => buildCompetenceFilterOptions(getAvailableCompetences(movements)),
    [movements],
  );

  const reportData = useMemo(
    () => computeReportData(employees, movements, filters, getMovementsForEmployee),
    [employees, filters, getMovementsForEmployee, movements],
  );

  const showMovementRows = filters.recordType !== 'all';
  const filtersDirty = isReportFiltersDirty(filters);
  const totalCardLabel =
    filters.recordType === 'all' ? 'Total previsto' : `Total (${reportData.recordTypeLabel.toLowerCase()})`;

  const stats = (
    <>
      <StatCard
        label={totalCardLabel}
        value={formatCurrency(reportData.totalForecast)}
        detail={filters.recordType === 'all' ? 'Valor gerencial previsto' : 'Soma dos registros filtrados'}
        iconImage={STAT_ICONS.previsaoDoMes}
        iconBg={BrandColors.blueLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Horas extras"
        value={reportData.overtimeHours}
        iconImage={STAT_ICONS.horasExtras}
        iconBg={BrandColors.amberLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Vales"
        value={formatCurrency(reportData.valesTotal)}
        iconImage={STAT_ICONS.vales}
        iconBg={BrandColors.blueLight}
        compact={isCompactLayout}
        fixedWidth={isCompactLayout ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Faltas"
        value={String(reportData.absenceCount)}
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
        <FilterSelect
          label="Funcionário"
          value={filters.employeeId}
          options={employeeOptions}
          compact={isCompactLayout}
          open={activeFilter === 'employee'}
          onOpenChange={(open) => setActiveFilter(open ? 'employee' : null)}
          onChange={(employeeId) => setFilters((current) => ({ ...current, employeeId }))}
        />
        <FilterSelect
          label="Período"
          value={filters.competence}
          options={competenceOptions}
          compact={isCompactLayout}
          open={activeFilter === 'period'}
          onOpenChange={(open) => setActiveFilter(open ? 'period' : null)}
          onChange={(competence) => setFilters((current) => ({ ...current, competence }))}
        />
        <FilterSelect
          label="Tipo de registro"
          value={filters.recordType}
          options={REPORT_RECORD_TYPE_OPTIONS}
          compact={isCompactLayout}
          open={activeFilter === 'recordType'}
          onOpenChange={(open) => setActiveFilter(open ? 'recordType' : null)}
          onChange={(recordType) => setFilters((current) => ({ ...current, recordType }))}
        />
      </View>

      {filtersDirty && (
        <View style={styles.clearFiltersWrap}>
          <Button
            label="Limpar filtros"
            variant="ghost"
            onPress={() => {
              setFilters(DEFAULT_REPORT_FILTERS);
              setActiveFilter(null);
            }}
          />
        </View>
      )}

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
          {isCompetenceClosed && filters.competence === DEFAULT_REPORT_FILTERS.competence
            ? 'Demonstrativo gerencial'
            : 'Prévia do demonstrativo gerencial'}
        </Text>
        <Text style={styles.previewSubtitle}>
          {reportData.competenceLabel} — {reportData.employeeLabel}
          {filters.recordType !== 'all' ? ` — ${reportData.recordTypeLabel}` : ''}
        </Text>
        <Text style={styles.disclaimer}>{MANAGERIAL_DISCLAIMER}</Text>

        {reportData.isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhum registro encontrado para os filtros selecionados.
            </Text>
          </View>
        ) : (
          <HorizontalTableScroll minTableWidth={showMovementRows ? 640 : 560}>
            {showMovementRows ? (
              <>
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewCol, styles.colName]}>Funcionário</Text>
                  <Text style={[styles.previewCol, styles.colRole]}>Cargo</Text>
                  <Text style={[styles.previewCol, styles.colDate]}>Data</Text>
                  <Text style={[styles.previewCol, styles.colValue]}>Valor</Text>
                </View>

                {reportData.movementRows.map((movement, index) => (
                  <View
                    key={movement.id}
                    style={[
                      styles.previewRow,
                      index < reportData.movementRows.length - 1 && styles.previewRowBorder,
                    ]}>
                    <Text style={[styles.previewCol, styles.colName, styles.previewName]}>
                      {movement.employeeName}
                    </Text>
                    <Text style={[styles.previewCol, styles.colRole]}>{movement.role}</Text>
                    <Text style={[styles.previewCol, styles.colDate, styles.previewMeta]}>
                      {formatShortDate(movement.occurrenceDate)}
                    </Text>
                    <Text style={[styles.previewCol, styles.colValue, styles.previewValue]}>
                      {movement.value}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewCol, styles.colName]}>Funcionário</Text>
                  <Text style={[styles.previewCol, styles.colRole]}>Cargo</Text>
                  <Text style={[styles.previewCol, styles.colValue]}>Previsão</Text>
                </View>

                {reportData.summaryRows.map((employee, index) => (
                  <View
                    key={employee.employeeId}
                    style={[
                      styles.previewRow,
                      index < reportData.summaryRows.length - 1 && styles.previewRowBorder,
                    ]}>
                    <Text style={[styles.previewCol, styles.colName, styles.previewName]}>
                      {employee.employeeName}
                    </Text>
                    <Text style={[styles.previewCol, styles.colRole]}>{employee.role}</Text>
                    <Text style={[styles.previewCol, styles.colValue, styles.previewValue]}>
                      {formatCurrency(employee.forecast)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </HorizontalTableScroll>
        )}

        {!reportData.isEmpty && (
          <View style={styles.previewFooter}>
            <Text style={styles.previewFooterLabel}>{totalCardLabel}</Text>
            <Text style={styles.previewFooterValue}>{formatCurrency(reportData.totalForecast)}</Text>
          </View>
        )}

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
    marginBottom: 12,
    flexWrap: 'wrap',
    zIndex: 30,
  },
  filtersCompact: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
  },
  clearFiltersWrap: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
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
  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
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
  colDate: { flex: 1, minWidth: 110 },
  colValue: { flex: 1, minWidth: 100, textAlign: 'right' },
  previewRow: { flexDirection: 'row', paddingVertical: 12, minWidth: 520 },
  previewRowBorder: { borderBottomWidth: 1, borderBottomColor: BrandColors.borderLight },
  previewName: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary, textTransform: 'none' },
  previewMeta: { fontSize: 13, color: BrandColors.textSecondary, textTransform: 'none' },
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
