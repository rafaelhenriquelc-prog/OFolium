import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/mobile/Screen';

import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HorizontalTableScroll } from '@/components/ui/HorizontalTableScroll';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/StatCard';
import { BrandColors } from '@/constants/colors';
import { STAT_ICONS } from '@/constants/statIcons';
import { ProLockedButton, useAppData } from '@/contexts/AppDataContext';
import type { EmployeeClosingSummary } from '@/data/types';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ESTIMATE_DISCLAIMER, MANAGERIAL_DISCLAIMER } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';

export default function ClosingsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { isPro } = usePlan();
  const { isCompactLayout } = useResponsiveLayout();
  const {
    competenceLabel,
    competenceStatus,
    closingSummaries,
    totalForecast,
    isCompetenceClosed,
    markEmployeeReviewed,
    closeCompetence,
    reopenCompetence,
    ProFeatureModalHost,
  } = useAppData();

  const [selectedClosing, setSelectedClosing] = useState<EmployeeClosingSummary | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const showPendingOnly = filter === 'pending';
  const displayedSummaries = showPendingOnly
    ? closingSummaries.filter((item) => item.reviewStatus !== 'Revisado')
    : closingSummaries;

  const reviewed = closingSummaries.filter((item) => item.reviewStatus === 'Revisado').length;
  const pending = closingSummaries.filter((item) => item.reviewStatus !== 'Revisado').length;
  const allReviewed = pending === 0 && closingSummaries.length > 0;

  const handleCloseCompetence = () => {
    if (!isPro) return;
    if (closeCompetence()) setShowCloseModal(false);
  };

  const handleReopen = () => {
    if (!isPro || !reopenReason.trim()) return;
    if (reopenCompetence(reopenReason.trim())) {
      setShowReopenModal(false);
      setReopenReason('');
    }
  };

  return (
    <Screen>
      <PageHeader
        title="Fechamentos"
        subtitle={
          showPendingOnly
            ? `${competenceLabel} · ${displayedSummaries.length} ${displayedSummaries.length === 1 ? 'pendente' : 'pendentes'} para revisão`
            : competenceLabel
        }
        action={
          isCompetenceClosed ? (
            isPro ? (
              <Button label="Reabrir competência" variant="outline" onPress={() => setShowReopenModal(true)} />
            ) : (
              <ProLockedButton label="Reabrir competência" feature="reopen_competence" />
            )
          ) : isPro ? (
            <Button
              label="Fechar competência"
              variant="secondary"
              disabled={!allReviewed}
              onPress={() => setShowCloseModal(true)}
            />
          ) : (
            <ProLockedButton label="Fechar competência" feature="close_competence" />
          )
        }
      />

      <Text style={styles.disclaimer}>{MANAGERIAL_DISCLAIMER}</Text>

      <View style={styles.statsRow}>
        <StatCard
          label="Total previsto"
          value={formatCurrency(totalForecast)}
          detail="Valor gerencial previsto"
          iconImage={STAT_ICONS.previsaoDoMes}
          iconBg={BrandColors.blueLight}
        />
        <StatCard
          label="Funcionários revisados"
          value={String(reviewed)}
          icon="✓"
          iconBg={BrandColors.greenLight}
          iconColor={BrandColors.green}
        />
        <StatCard
          label="Pendentes"
          value={String(pending)}
          icon="◉"
          iconBg={BrandColors.amberLight}
          iconColor={BrandColors.amber}
        />
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status da competência</Text>
        <Badge label={competenceStatus} variant={getStatusVariant(competenceStatus)} />
      </Card>

      <Card style={[styles.tableCard, isCompactLayout && styles.tableCardMobile]}>
        <HorizontalTableScroll minTableWidth={760}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, styles.colName]}>Nome</Text>
            <Text style={[styles.columnHeader, styles.colSalary]}>Salário base</Text>
            <Text style={[styles.columnHeader, styles.colExtra]}>Adicionais</Text>
            <Text style={[styles.columnHeader, styles.colDiscount]}>Descontos</Text>
            <Text style={[styles.columnHeader, styles.colForecast]}>Valor previsto</Text>
            <Text style={[styles.columnHeader, styles.colStatus]}>Revisão</Text>
          </View>

          {displayedSummaries.map((closing, index) => (
            <Pressable
              key={closing.employeeId}
              style={[styles.tableRow, index < displayedSummaries.length - 1 && styles.tableRowBorder]}
              onPress={() => setSelectedClosing(closing)}>
              <Text style={[styles.cellName, styles.colName]}>{closing.employeeName}</Text>
              <Text style={[styles.cellText, styles.colSalary]}>
                {formatCurrency(closing.baseSalary)}
              </Text>
              <Text style={[styles.cellText, styles.colExtra, styles.positive]}>
                +{formatCurrency(closing.extras + closing.additions)}
              </Text>
              <Text style={[styles.cellText, styles.colDiscount, styles.negative]}>
                −{formatCurrency(closing.vales + closing.discounts)}
              </Text>
              <Text style={[styles.cellForecast, styles.colForecast]}>
                {formatCurrency(closing.forecast)}
              </Text>
              <View style={styles.colStatus}>
                <Badge label={closing.reviewStatus} variant={getStatusVariant(closing.reviewStatus)} />
              </View>
            </Pressable>
          ))}
        </HorizontalTableScroll>
      </Card>

      <ClosingDetailModal
        closing={selectedClosing}
        isPro={isPro}
        onClose={() => setSelectedClosing(null)}
        onReview={(employeeId) => {
          if (!isPro) return;
          markEmployeeReviewed(employeeId);
          setSelectedClosing(null);
        }}
      />

      <Modal
        title={`Fechar ${competenceLabel.toLowerCase()}?`}
        visible={showCloseModal}
        onClose={() => setShowCloseModal(false)}>
        <Text style={styles.modalText}>
          Os dados desta competência serão preservados. Alterações futuras nos funcionários e nas
          movimentações não modificarão este fechamento.
        </Text>
        <Text style={styles.modalWarning}>
          Este fechamento possui finalidade gerencial e não substitui a folha de pagamento oficial ou
          a conferência de um profissional contábil.
        </Text>
        <View style={styles.modalActions}>
          <Button label="Continuar revisando" variant="outline" onPress={() => setShowCloseModal(false)} />
          <View style={styles.modalPrimary}>
            <Button label="Confirmar fechamento" fullWidth onPress={handleCloseCompetence} />
          </View>
        </View>
      </Modal>

      <Modal title="Reabrir competência" visible={showReopenModal} onClose={() => setShowReopenModal(false)}>
        <Text style={styles.modalText}>
          Informe a justificativa para reabrir a competência. A versão anterior será preservada.
        </Text>
        <Input
          label="Justificativa"
          placeholder="Descreva o motivo da reabertura"
          value={reopenReason}
          onChangeText={setReopenReason}
        />
        <View style={styles.modalActions}>
          <Button label="Cancelar" variant="outline" onPress={() => setShowReopenModal(false)} />
          <View style={styles.modalPrimary}>
            <Button label="Confirmar reabertura" fullWidth onPress={handleReopen} />
          </View>
        </View>
      </Modal>

      <ProFeatureModalHost />
    </Screen>
  );
}

function ClosingDetailModal({
  closing,
  isPro,
  onClose,
  onReview,
}: {
  closing: EmployeeClosingSummary | null;
  isPro: boolean;
  onClose: () => void;
  onReview: (employeeId: string) => void;
}) {
  if (!closing) return null;

  return (
    <Modal
      title={`Fechamento — ${closing.employeeName}`}
      visible={!!closing}
      onClose={onClose}
      wide>
      <View style={styles.breakdown}>
        <BreakdownLine label="Salário base" value={formatCurrency(closing.baseSalary)} />
        <BreakdownLine label="+ Horas extras" value={formatCurrency(closing.extras)} positive />
        <BreakdownLine label="+ Adicionais" value={formatCurrency(closing.additions)} positive />
        <BreakdownLine label="− Vales" value={formatCurrency(closing.vales)} negative />
        <BreakdownLine label="− Faltas/descontos" value={formatCurrency(closing.discounts)} negative />
        <View style={styles.divider} />
        <BreakdownLine label="= Valor previsto" value={formatCurrency(closing.forecast)} total />
      </View>
      <Text style={styles.estimateNotice}>{ESTIMATE_DISCLAIMER}</Text>
      <Badge label={closing.reviewStatus} variant={getStatusVariant(closing.reviewStatus)} />
      {closing.reviewStatus !== 'Revisado' && (
        <View style={styles.reviewAction}>
          {isPro ? (
            <Button label="Marcar como revisado" onPress={() => onReview(closing.employeeId)} />
          ) : (
            <ProLockedButton
              label="Marcar como revisado"
              feature="review_employee"
              fullWidth
            />
          )}
        </View>
      )}
    </Modal>
  );
}

function BreakdownLine({
  label,
  value,
  positive,
  negative,
  total,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  total?: boolean;
}) {
  return (
    <View style={styles.breakdownLine}>
      <Text style={[styles.breakdownLabel, total && styles.breakdownLabelTotal]}>{label}</Text>
      <Text
        style={[
          styles.breakdownValue,
          positive && { color: BrandColors.green },
          negative && { color: BrandColors.red },
          total && styles.breakdownValueTotal,
        ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.textSecondary,
    marginBottom: 16,
  },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLabel: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableCardMobile: { overflow: 'visible' },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    backgroundColor: BrandColors.offWhite,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  colName: { flex: 2, minWidth: 140 },
  colSalary: { flex: 1.2, minWidth: 100 },
  colExtra: { flex: 1, minWidth: 90 },
  colDiscount: { flex: 1, minWidth: 90 },
  colForecast: { flex: 1.2, minWidth: 110 },
  colStatus: { flex: 1, minWidth: 100 },
  cellName: { fontSize: 14, fontWeight: '600', color: BrandColors.textPrimary },
  cellText: { fontSize: 14, color: BrandColors.textSecondary },
  cellForecast: { fontSize: 14, fontWeight: '700', color: BrandColors.textPrimary },
  positive: { color: BrandColors.green },
  negative: { color: BrandColors.red },
  breakdown: { gap: 10, marginBottom: 16 },
  breakdownLine: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 14, color: BrandColors.textSecondary },
  breakdownLabelTotal: { fontWeight: '700', color: BrandColors.textPrimary },
  breakdownValue: { fontSize: 14, color: BrandColors.textPrimary, fontWeight: '500' },
  breakdownValueTotal: { fontSize: 16, fontWeight: '700', color: BrandColors.orange },
  divider: { height: 1, backgroundColor: BrandColors.border, marginVertical: 8 },
  estimateNotice: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textMuted,
    marginBottom: 12,
  },
  reviewAction: { marginTop: 16 },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.textMuted,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalPrimary: { flex: 1 },
});
