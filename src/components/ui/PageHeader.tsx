import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/colors';
import { MobileType } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  centered?: boolean;
};

export function PageHeader({ title, subtitle, action, centered }: PageHeaderProps) {
  const { isMobile, isTablet } = useResponsiveLayout();
  const compact = isMobile || isTablet;

  return (
    <View style={[styles.header, compact && styles.headerCompact, centered && styles.headerCentered]}>
      <View style={[styles.left, !compact && styles.leftDesktop, centered && styles.leftCentered]}>
        <Text style={[styles.title, compact && styles.titleCompact, centered && styles.titleCentered]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, compact && styles.subtitleCompact, centered && styles.subtitleCentered]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View style={[styles.action, compact && styles.actionCompact]}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    gap: 16,
    flexWrap: 'wrap',
  },
  headerCompact: {
    flexDirection: 'column',
    marginBottom: 20,
    gap: 12,
  },
  left: {
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  leftDesktop: {
    minWidth: 200,
  },
  headerCentered: {
    justifyContent: 'center',
  },
  leftCentered: {
    alignItems: 'center',
    flex: 0,
    width: '100%',
    maxWidth: 560,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitleCentered: {
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: MobileType.pageTitle,
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    lineHeight: 20,
  },
  subtitleCompact: {
    fontSize: MobileType.bodySmall,
    lineHeight: 19,
  },
  action: {
    flexShrink: 0,
  },
  actionCompact: {
    alignSelf: 'stretch',
  },
});
