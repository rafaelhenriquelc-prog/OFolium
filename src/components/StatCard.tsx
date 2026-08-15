import { Image, type ImageSource } from 'expo-image';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { STAT_ICONS } from '@/constants/statIcons';
import {
  MOBILE_STAT_CARD_WIDTH,
  MobileSpace,
  MobileType,
} from '@/constants/layout';
import { useAppData } from '@/contexts/AppDataContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatCurrency } from '@/utils/format';

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  detailAction?: string;
  icon?: string;
  iconImage?: ImageSource;
  iconBg: string;
  iconColor?: string;
  highlighted?: boolean;
  fixedWidth?: number;
  compact?: boolean;
};

export function StatCard({
  label,
  value,
  detail,
  detailAction,
  icon,
  iconImage,
  iconBg,
  iconColor,
  highlighted,
  fixedWidth,
  compact,
}: StatCardProps) {
  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        highlighted && styles.cardHighlighted,
        fixedWidth ? { width: fixedWidth, minWidth: fixedWidth, flex: 0 } : null,
      ]}>
      <View style={[styles.cardTop, compact && styles.cardTopCompact]}>
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { backgroundColor: iconBg }]}>
          {iconImage ? (
            <Image
              source={iconImage}
              style={[styles.iconImage, compact && styles.iconImageCompact]}
              contentFit="contain"
            />
          ) : (
            <Text style={[styles.icon, compact && styles.iconCompact, { color: iconColor }]}>{icon}</Text>
          )}
        </View>
      </View>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      {detail && (
        <Text style={[styles.detail, compact && styles.detailCompact, highlighted && styles.detailHighlighted]}>
          {detail}
        </Text>
      )}
      {detailAction && (
        <Pressable>
          <Text style={[styles.detailAction, compact && styles.detailActionCompact]}>{detailAction}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function StatCardsRow() {
  const { dashboardStats } = useAppData();
  const { isMobile } = useResponsiveLayout();

  const cards = (
    <>
      <StatCard
        label="Funcionários ativos"
        value={String(dashboardStats.activeEmployees)}
        detail={dashboardStats.competenceLabel}
        iconImage={STAT_ICONS.funcionariosAtivos}
        iconBg={BrandColors.orangeLight}
        highlighted
        compact={isMobile}
        fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Previsão do mês"
        value={formatCurrency(dashboardStats.monthForecast)}
        detail="Valor gerencial previsto"
        iconImage={STAT_ICONS.previsaoDoMes}
        iconBg={BrandColors.blueLight}
        compact={isMobile}
        fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Horas extras"
        value={dashboardStats.overtimeHours}
        detail={`${dashboardStats.overtimeEmployeeCount} funcionário${dashboardStats.overtimeEmployeeCount === 1 ? '' : 's'}`}
        iconImage={STAT_ICONS.horasExtras}
        iconBg={BrandColors.amberLight}
        compact={isMobile}
        fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
      <StatCard
        label="Pendências"
        value={String(dashboardStats.pendingCount)}
        detailAction="Ver detalhes"
        iconImage={STAT_ICONS.pendencias}
        iconBg={BrandColors.redLight}
        compact={isMobile}
        fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
      />
    </>
  );

  if (isMobile) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileRow}
        style={styles.mobileScroll}>
        {cards}
      </ScrollView>
    );
  }

  return <View style={styles.row}>{cards}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  mobileScroll: {
    marginBottom: MobileSpace.section,
  },
  mobileRow: {
    flexDirection: 'row',
    gap: MobileSpace.cardGap,
    paddingRight: 4,
  },
  card: {
    flex: 1,
    minWidth: 180,
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 6,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardCompact: {
    padding: MobileSpace.cardPadding,
    gap: 4,
    borderRadius: 12,
  },
  cardHighlighted: {
    borderColor: 'rgba(255, 92, 0, 0.15)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTopCompact: {
    marginBottom: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  iconImageCompact: {
    width: 16,
    height: 16,
  },
  icon: {
    fontSize: 18,
    fontWeight: '600',
  },
  iconCompact: {
    fontSize: 15,
  },
  label: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    fontWeight: '500',
  },
  labelCompact: {
    fontSize: MobileType.caption,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.5,
  },
  valueCompact: {
    fontSize: MobileType.statValue,
    letterSpacing: -0.3,
  },
  detail: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
  detailCompact: {
    fontSize: MobileType.caption,
  },
  detailHighlighted: {
    color: BrandColors.green,
    fontWeight: '600',
  },
  detailAction: {
    fontSize: 12,
    color: BrandColors.orange,
    fontWeight: '600',
    marginTop: 2,
  },
  detailActionCompact: {
    fontSize: MobileType.caption,
  },
});
