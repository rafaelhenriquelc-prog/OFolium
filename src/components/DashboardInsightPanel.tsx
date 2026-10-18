import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { BrandColors, Shadows } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { useDashboardCompetence } from '@/hooks/useDashboardCompetence';
import { ESTIMATE_DISCLAIMER } from '@/utils/calculations';
import { isEmployeeActive } from '@/utils/employee';
import { formatCurrency, formatShortDate } from '@/utils/format';

export type DashboardPanelId = 'employees' | 'forecast' | 'overtime' | 'pending';

export function DashboardInsightPanel({
  panel,
  competence,
}: {
  panel: DashboardPanelId;
  competence: string;
}) {
  return (
    <View style={styles.panel}>
      {panel === 'employees' && <EmployeesPanel />}
      {panel === 'forecast' && <ForecastPanel competence={competence} />}
      {panel === 'overtime' && <OvertimePanel competence={competence} />}
      {panel === 'pending' && <PendingPanel competence={competence} />}
    </View>
  );
}

function EmployeesPanel() {
  const router = useRouter();
  const { employees, isLoading } = useEmployees();
  const activeEmployees = employees.filter((employee) => isEmployeeActive(employee.status));

  return (
    <>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Funcionários ativos</Text>
        <Pressable
          onPress={() => router.push('/employees' as Href)}
          accessibilityRole="button"
          style={styles.linkButton}>
          <Text style={styles.linkText}>Ver todos</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <LoadingLine label="Carregando funcionários…" />
      ) : activeEmployees.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum funcionário ativo.</Text>
      ) : (
        activeEmployees.map((employee) => (
          <View key={employee.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {employee.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {employee.role}
              </Text>
            </View>
            <Badge label={employee.status} variant={getStatusVariant(employee.status)} />
            <Pressable
              style={styles.pencilButton}
              onPress={() => router.push(`/employees/${employee.id}` as Href)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${employee.name}`}>
              <AppIcon
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                size={16}
                color={BrandColors.orange}
              />
            </Pressable>
          </View>
        ))
      )}
    </>
  );
}

function ForecastPanel({ competence }: { competence: string }) {
  const { summaries, totalForecast, competenceLabel } = useDashboardCompetence(competence);
  const baseSalary = summaries.reduce((sum, item) => sum + item.baseSalary, 0);
  const extras = summaries.reduce((sum, item) => sum + item.extras, 0);
  const additions = summaries.reduce((sum, item) => sum + item.additions, 0);
  const vales = summaries.reduce((sum, item) => sum + item.vales, 0);
  const discounts = summaries.reduce((sum, item) => sum + item.discounts, 0);

  return (
    <>
      <Text style={styles.panelTitle}>Previsão do mês · {competenceLabel}</Text>
      {summaries.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum funcionário ativo para compor a previsão.</Text>
      ) : (
        <>
          <AmountLine label="Salários base" value={baseSalary} />
          <AmountLine label="Horas extras" value={extras} />
          <AmountLine label="Adicionais" value={additions} />
          <AmountLine label="Vales" value={vales} signed />
          <AmountLine label="Descontos" value={discounts} signed />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total previsto</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalForecast)}</Text>
          </View>
          {summaries.map((item) => (
            <View key={item.employeeId} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.employeeName}
              </Text>
              <Text style={styles.rowValue}>{formatCurrency(item.forecast)}</Text>
            </View>
          ))}
        </>
      )}
      <Text style={styles.disclaimer}>{ESTIMATE_DISCLAIMER}</Text>
    </>
  );
}

function OvertimePanel({ competence }: { competence: string }) {
  const { competenceMovements, competenceLabel } = useDashboardCompetence(competence);
  const records = competenceMovements.filter((movement) => movement.type === 'Hora extra');

  return (
    <>
      <Text style={styles.panelTitle}>Horas extras · {competenceLabel}</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma hora extra nesta competência.</Text>
      ) : (
        records.map((record) => (
          <View key={record.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {record.employeeName}
              </Text>
              <Text style={styles.rowMeta}>{formatShortDate(record.occurrenceDate)}</Text>
            </View>
            <Text style={styles.rowValue}>{record.value}</Text>
          </View>
        ))
      )}
    </>
  );
}

function PendingPanel({ competence }: { competence: string }) {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();
  const {
    pendingItems,
    pendingTitle,
    pendingEmptyMessage,
    pendingShortcut,
    showPendingShortcut,
    pendingDetailsPath,
  } = useDashboardCompetence(competence);

  return (
    <>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{pendingTitle}</Text>
        {showPendingShortcut ? (
          <Pressable
            onPress={() => router.push(pendingDetailsPath as Href)}
            accessibilityRole="button"
            style={styles.linkButton}>
            <Text style={styles.linkText}>{pendingShortcut}</Text>
          </Pressable>
        ) : null}
      </View>
      {isAuthLoading ? (
        <LoadingLine label="Carregando pendências…" />
      ) : pendingItems.length === 0 ? (
        <Text style={styles.emptyText}>{pendingEmptyMessage}</Text>
      ) : (
        pendingItems.map((item) => (
          <View key={item.id} style={styles.pendingItem}>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{item.type}</Text>
              <Text style={styles.rowMeta}>{item.dateLabel}</Text>
            </View>
            {item.employeeName ? <Text style={styles.rowMeta}>{item.employeeName}</Text> : null}
            <Text style={styles.pendingDescription}>{item.description}</Text>
            <Pressable
              onPress={() => router.push(item.actionPath as Href)}
              accessibilityRole="button"
              accessibilityLabel={item.actionLabel}
              style={styles.linkButton}>
              <Text style={styles.linkText}>{item.actionLabel}</Text>
            </Pressable>
          </View>
        ))
      )}
    </>
  );
}

function AmountLine({ label, value, signed }: { label: string; value: number; signed?: boolean }) {
  const formatted = signed && value > 0 ? `− ${formatCurrency(value)}` : formatCurrency(value);
  return (
    <View style={styles.amountLine}>
      <Text style={styles.rowMeta}>{label}</Text>
      <Text style={styles.rowValue}>{formatted}</Text>
    </View>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator size="small" color={BrandColors.orange} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 16,
    gap: 10,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  linkButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.orange,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  rowMeta: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  pencilButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.orange,
  },
  pendingItem: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
  },
  pendingDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.textMuted,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
