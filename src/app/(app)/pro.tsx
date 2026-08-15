import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlanTrialModal } from '@/components/PlanTrialModal';
import { Screen } from '@/components/mobile/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HorizontalTableScroll } from '@/components/ui/HorizontalTableScroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandColors, Shadows } from '@/constants/colors';
import {
  PLAN_CARD_CONTENT,
  PLAN_TABLE_ROWS,
  PLANS,
  PRO_BENEFITS,
  type PlanTableCellValue,
} from '@/constants/plans';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function ProScreen() {
  const { isPro, successMessage, activateTrial, clearSuccessMessage } = usePlan();
  const { isCompactLayout } = useResponsiveLayout();
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => clearSuccessMessage(), 5000);
    return () => clearTimeout(timer);
  }, [successMessage, clearSuccessMessage]);

  const handleActivateTrial = () => {
    setShowTrialModal(false);
    activateTrial();
  };

  const openTrialModal = () => {
    if (isPro) return;
    setShowTrialModal(true);
  };

  return (
    <Screen>
      <PageHeader
        title="Conheça o OFolium Pro"
        subtitle="Organize sua equipe, revise o fechamento mensal e gere um relatório claro para enviar ao contador."
      />

      {successMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <ScrollView
        horizontal={isCompactLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.comparisonRow, isCompactLayout && styles.comparisonRowCompact]}
        style={isCompactLayout ? styles.comparisonScroll : undefined}>
        <PlanCard
          title={PLANS.base.name}
          price={PLAN_CARD_CONTENT.base.price}
          limit={`Até ${PLAN_CARD_CONTENT.base.activeLimit} funcionários ativos`}
          description={PLAN_CARD_CONTENT.base.description}
          features={PLAN_CARD_CONTENT.base.features}
          current={!isPro}
        />
        <PlanCard
          title={PLANS.pro.name}
          price={PLAN_CARD_CONTENT.pro.price}
          limit={`Até ${PLAN_CARD_CONTENT.pro.activeLimit} funcionários ativos`}
          description={PLAN_CARD_CONTENT.pro.description}
          features={PLAN_CARD_CONTENT.pro.features}
          highlighted
          popular
          current={isPro}
          trialButtonLabel={isPro ? 'Plano atual' : 'Experimentar Pro grátis'}
          trialDisabled={isPro}
          onTrialPress={openTrialModal}
        />
      </ScrollView>

      <Text style={styles.sectionTitle}>Compare os planos</Text>
      <Card style={styles.tableCard}>
        <HorizontalTableScroll minTableWidth={480}>
          <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.tableFeatureCol]}>Funcionalidade</Text>
          <Text style={[styles.tableHeaderCell, styles.tablePlanCol]}>Plano Base</Text>
          <Text style={[styles.tableHeaderCell, styles.tablePlanCol]}>Plano Pro</Text>
        </View>
        {PLAN_TABLE_ROWS.map((row, index) => (
          <View
            key={row.label}
            style={[styles.tableRow, index < PLAN_TABLE_ROWS.length - 1 && styles.tableRowBorder]}>
            <Text style={[styles.tableFeatureCell, styles.tableFeatureCol]}>{row.label}</Text>
            <View style={[styles.tableValueCell, styles.tablePlanCol]}>
              <PlanTableCell value={row.base} />
            </View>
            <View style={[styles.tableValueCell, styles.tablePlanCol]}>
              <PlanTableCell value={row.pro} />
            </View>
          </View>
        ))}
        </HorizontalTableScroll>
      </Card>

      <View style={styles.benefitsGrid}>
        {PRO_BENEFITS.map((benefit) => (
          <Card key={benefit.title} style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>{benefit.title}</Text>
            <Text style={styles.benefitDescription}>{benefit.description}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.finalCtaCard}>
        <Text style={styles.finalCtaTitle}>Feche o mês sem depender de anotações espalhadas.</Text>
        <Text style={styles.finalCtaSubtitle}>
          Experimente o Pro gratuitamente por 30 dias.
        </Text>
        <View style={styles.finalCtaButton}>
          <Button
            label={isPro ? 'Plano atual' : 'Experimentar Pro grátis'}
            fullWidth
            disabled={isPro}
            onPress={openTrialModal}
            style={isPro ? styles.disabledButton : undefined}
          />
        </View>
        <Text style={styles.finalCtaHelper}>
          Nenhuma cobrança será realizada durante o período de teste.
        </Text>
        <Text style={styles.finalDisclaimer}>
          Os valores e documentos gerados pelo OFolium possuem finalidade gerencial e não substituem a
          folha de pagamento oficial ou a conferência contábil.
        </Text>
      </Card>

      <PlanTrialModal
        visible={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onActivate={handleActivateTrial}
      />
    </Screen>
  );
}

function PlanTableCell({ value }: { value: PlanTableCellValue }) {
  if (value === 'included') {
    return <Text style={styles.tableCheck}>✓</Text>;
  }

  if (value === 'unavailable') {
    return <Text style={styles.tableDash}>—</Text>;
  }

  return <Text style={styles.tableText}>{value}</Text>;
}

function PlanCard({
  title,
  price,
  limit,
  description,
  features,
  highlighted,
  popular,
  current,
  trialButtonLabel,
  trialDisabled,
  onTrialPress,
}: {
  title: string;
  price: string;
  limit: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
  current?: boolean;
  trialButtonLabel?: string;
  trialDisabled?: boolean;
  onTrialPress?: () => void;
}) {
  return (
    <Card style={[styles.planCard, highlighted && styles.planCardHighlighted]}>
      <View style={styles.planCardHeader}>
        <Text style={styles.planCardTitle}>{title}</Text>
        <View style={styles.planCardBadges}>
          {popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Mais escolhido</Text>
            </View>
          )}
          {current && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Atual</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.planCardPrice}>{price}</Text>
      <Text style={styles.planCardLimit}>{limit}</Text>
      <Text style={styles.planCardDescription}>{description}</Text>
      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      {trialButtonLabel && onTrialPress && (
        <View style={styles.planCardButton}>
          <Button
            label={trialButtonLabel}
            fullWidth
            disabled={trialDisabled}
            onPress={onTrialPress}
            style={trialDisabled ? styles.disabledButton : undefined}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: BrandColors.greenLight,
    borderWidth: 1,
    borderColor: 'rgba(34, 160, 107, 0.25)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.green,
  },
  comparisonScroll: {
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  comparisonRowCompact: {
    flexWrap: 'nowrap',
    paddingRight: 16,
  },
  planCard: {
    flex: 1,
    minWidth: 280,
    gap: 12,
    ...(Platform.OS === 'web' ? { maxWidth: 360 } : {}),
  },
  planCardHighlighted: {
    borderColor: 'rgba(255, 92, 0, 0.25)',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  planCardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    flex: 1,
    minWidth: 120,
  },
  popularBadge: {
    backgroundColor: BrandColors.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.white,
  },
  currentBadge: {
    backgroundColor: BrandColors.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.orange,
  },
  planCardPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.5,
  },
  planCardLimit: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  planCardDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
  },
  featureList: {
    gap: 8,
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: 14,
    color: BrandColors.orange,
    lineHeight: 20,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.textSecondary,
  },
  planCardButton: {
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginTop: 32,
    marginBottom: 16,
  },
  tableCard: {
    padding: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: BrandColors.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    alignItems: 'flex-start',
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  tableFeatureCol: {
    flex: 2,
    minWidth: 160,
  },
  tablePlanCol: {
    flex: 1,
    minWidth: 100,
  },
  tableFeatureCell: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.textPrimary,
    lineHeight: 20,
  },
  tableValueCell: {
    justifyContent: 'center',
    minHeight: 20,
  },
  tableCheck: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.green,
  },
  tableDash: {
    fontSize: 14,
    color: BrandColors.textMuted,
  },
  tableText: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.textSecondary,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 32,
  },
  benefitCard: {
    flex: 1,
    minWidth: 220,
    gap: 8,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
  },
  finalCtaCard: {
    marginTop: 32,
    gap: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { maxWidth: 560, alignSelf: 'center' as const, width: '100%' as const } : {}),
  },
  finalCtaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  finalCtaSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  finalCtaButton: {
    width: '100%',
    marginTop: 4,
  },
  finalCtaHelper: {
    fontSize: 12,
    color: BrandColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  finalDisclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: BrandColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
