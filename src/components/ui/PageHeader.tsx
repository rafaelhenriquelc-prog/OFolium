import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/colors';
import { MobileType } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const { isMobile, isTablet } = useResponsiveLayout();
  const compact = isMobile || isTablet;

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={[styles.left, !compact && styles.leftDesktop]}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>}
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
