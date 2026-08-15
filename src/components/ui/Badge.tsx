import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/colors';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

const variantStyles: Record<BadgeVariant, { bg: string; color: string; dot: string }> = {
  success: { bg: BrandColors.greenLight, color: BrandColors.green, dot: BrandColors.green },
  error: { bg: BrandColors.redLight, color: BrandColors.red, dot: BrandColors.red },
  warning: { bg: BrandColors.amberLight, color: BrandColors.amber, dot: BrandColors.amber },
  info: { bg: BrandColors.blueLight, color: BrandColors.blue, dot: BrandColors.blue },
  neutral: { bg: BrandColors.offWhite, color: BrandColors.textSecondary, dot: BrandColors.textMuted },
};

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
};

export function Badge({ label, variant = 'success', showDot = true }: BadgeProps) {
  const colors = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      {showDot && <View style={[styles.dot, { backgroundColor: colors.dot }]} />}
      <Text style={[styles.text, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

export function getStatusVariant(status: string): BadgeVariant {
  if (status === 'Pendente') return 'warning';
  if (status === 'Em revisão') return 'info';
  if (status === 'Fechado' || status === 'Revisado') return 'success';
  if (status === 'Inativo' || status === 'Inativa') return 'neutral';
  return 'success';
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
