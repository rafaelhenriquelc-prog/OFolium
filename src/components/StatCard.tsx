import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { FadeSlideIn } from '@/components/animation/FadeSlideIn';
import { PendingDetailsModal } from '@/components/PendingDetailsModal';
import { AppIcon } from '@/components/ui/AppIcon';
import { BrandColors, Shadows } from '@/constants/colors';
import { ICON_SIZES, STAT_SYMBOLS, type StatIconType } from '@/constants/icons';
import { DASHBOARD_STAT_ICONS } from '@/constants/statIcons';
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
  /** Alias de iconImage para compatibilidade semântica. */
  iconSource?: ImageSource;
  iconType?: StatIconType;
  iconDot?: boolean;
  /** Quando true, o PNG já traz o círculo pêssego — não renderiza fundo extra. */
  iconIncludesBackground?: boolean;
  iconBg?: string;
  iconColor?: string;
  highlighted?: boolean;
  fixedWidth?: number;
  compact?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const STAT_CARD_ICON_BG = BrandColors.offWhite;
const STAT_CARD_ICON_COLOR = BrandColors.graphite;

export function StatCard({
  label,
  value,
  detail,
  detailAction,
  icon,
  iconImage: iconImageProp,
  iconSource,
  iconType,
  iconDot,
  iconIncludesBackground = false,
  iconBg: iconBgProp,
  iconColor = STAT_CARD_ICON_COLOR,
  highlighted,
  fixedWidth,
  compact,
  onPress,
  accessibilityLabel,
}: StatCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const iconImage = iconImageProp ?? iconSource;
  const iconSize = compact ? ICON_SIZES.statCardCompact : ICON_SIZES.statCard;
  const iconCircleSize = compact ? 32 : 40;
  const iconBg = iconIncludesBackground ? 'transparent' : (iconBgProp ?? STAT_CARD_ICON_BG);

  const iconContent = iconDot ? (
    <View
      style={[
        styles.iconDot,
        compact && styles.iconDotCompact,
        { backgroundColor: iconColor },
      ]}
    />
  ) : iconImage ? (
    <Image
      source={iconImage}
      style={
        iconIncludesBackground
          ? { width: iconCircleSize, height: iconCircleSize }
          : [styles.iconImage, compact && styles.iconImageCompact]
      }
      contentFit="contain"
    />
  ) : iconType ? (
    <AppIcon name={STAT_SYMBOLS[iconType]} size={iconSize} color={iconColor} />
  ) : (
    <Text style={[styles.icon, compact && styles.iconCompact, { color: iconColor }]}>{icon}</Text>
  );

  const cardContent = (
    <>
      <View style={[styles.cardTop, compact && styles.cardTopCompact]}>
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { backgroundColor: iconBg }]}>
          {iconContent}
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
        <Text style={[styles.detailAction, compact && styles.detailActionCompact]}>{detailAction}</Text>
      )}
    </>
  );

  const cardStyle = [
    styles.card,
    compact && styles.cardCompact,
    highlighted && styles.cardHighlighted,
    onPress && styles.cardInteractive,
    onPress && isFocused && styles.cardFocused,
    fixedWidth ? { width: fixedWidth, minWidth: fixedWidth, flex: 0 } : null,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `${label}. ${detailAction ?? 'Ver detalhes'}`}
        onPress={onPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={({ pressed, hovered }) => [
          ...cardStyle,
          (pressed || hovered) && styles.cardPressed,
        ]}>
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {cardContent}
    </View>
  );
}

type StatCardsRowEntryAnimation = {
  baseDelay?: number;
  stagger?: number;
  duration?: number;
  translateY?: number;
};

type StatCardsRowProps = {
  entryAnimation?: StatCardsRowEntryAnimation;
};

function wrapStatCard(
  card: React.ReactElement,
  index: number,
  enterStyle: ViewStyle | undefined,
  entryAnimation?: StatCardsRowEntryAnimation,
) {
  if (!entryAnimation) {
    return card;
  }

  const { baseDelay = 0, stagger = 60, duration = 400, translateY = 10 } = entryAnimation;

  return (
    <FadeSlideIn
      key={card.key ?? index}
      delay={baseDelay + index * stagger}
      duration={duration}
      translateY={translateY}
      style={enterStyle}>
      {card}
    </FadeSlideIn>
  );
}

export function StatCardsRow({ entryAnimation }: StatCardsRowProps = {}) {
  const { dashboardStats } = useAppData();
  const { isMobile } = useResponsiveLayout();
  const [showPendingDetails, setShowPendingDetails] = useState(false);

  const mobileEnterStyle = isMobile
    ? ({ width: MOBILE_STAT_CARD_WIDTH, flexShrink: 0 } as ViewStyle)
    : undefined;
  const desktopEnterStyle = isMobile ? undefined : styles.statCardEnter;

  const cardElements: { card: React.ReactElement; enterStyle?: ViewStyle }[] = [
    {
      enterStyle: mobileEnterStyle ?? desktopEnterStyle,
      card: (
        <StatCard
          label="Funcionários ativos"
          value={String(dashboardStats.activeEmployees)}
          detail={dashboardStats.competenceLabel}
          iconImage={DASHBOARD_STAT_ICONS.activeEmployees}
          iconIncludesBackground
          highlighted
          compact={isMobile}
          fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
        />
      ),
    },
    {
      enterStyle: mobileEnterStyle ?? desktopEnterStyle,
      card: (
        <StatCard
          label="Previsão do mês"
          value={formatCurrency(dashboardStats.monthForecast)}
          detail="Valor gerencial previsto"
          iconImage={DASHBOARD_STAT_ICONS.monthForecast}
          iconIncludesBackground
          compact={isMobile}
          fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
        />
      ),
    },
    {
      enterStyle: mobileEnterStyle ?? desktopEnterStyle,
      card: (
        <StatCard
          label="Horas extras"
          value={dashboardStats.overtimeHours}
          detail={`${dashboardStats.overtimeEmployeeCount} funcionário${dashboardStats.overtimeEmployeeCount === 1 ? '' : 's'}`}
          iconImage={DASHBOARD_STAT_ICONS.overtime}
          iconIncludesBackground
          compact={isMobile}
          fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
        />
      ),
    },
    {
      enterStyle: mobileEnterStyle ?? desktopEnterStyle,
      card: (
        <StatCard
          label="Pendências"
          value={String(dashboardStats.pendingCount)}
          detailAction="Ver detalhes"
          iconImage={DASHBOARD_STAT_ICONS.pending}
          iconIncludesBackground
          compact={isMobile}
          fixedWidth={isMobile ? MOBILE_STAT_CARD_WIDTH : undefined}
          onPress={() => setShowPendingDetails(true)}
          accessibilityLabel={`Pendências: ${dashboardStats.pendingCount}. Ver detalhes`}
        />
      ),
    },
  ];

  const cards = cardElements.map(({ card, enterStyle }, index) =>
    wrapStatCard(card, index, enterStyle, entryAnimation),
  );

  if (isMobile) {
    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileRow}
          style={styles.mobileScroll}>
          {cards}
        </ScrollView>
        <PendingDetailsModal
          visible={showPendingDetails}
          onClose={() => setShowPendingDetails(false)}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.row}>{cards}</View>
      <PendingDetailsModal visible={showPendingDetails} onClose={() => setShowPendingDetails(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  statCardEnter: {
    flex: 1,
    minWidth: 180,
  },
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
  cardInteractive: {
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  cardPressed: {
    opacity: 0.94,
    borderColor: 'rgba(255, 92, 0, 0.22)',
  },
  cardFocused: {
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 2,
          outlineColor: BrandColors.orange,
          outlineStyle: 'solid' as const,
          outlineOffset: 2,
        }
      : {}),
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
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconDotCompact: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
