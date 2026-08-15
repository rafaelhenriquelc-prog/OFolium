import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { BrandColors } from '@/constants/colors';
import { MIN_TOUCH_TARGET } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
};

function spinnerColor(variant: ButtonVariant) {
  if (variant === 'primary' || variant === 'secondary') {
    return BrandColors.white;
  }
  return BrandColors.orange;
}

export function Button({
  label,
  variant = 'primary',
  fullWidth,
  loading,
  loadingLabel,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { isMobile } = useResponsiveLayout();
  const displayLabel = loading && loadingLabel ? loadingLabel : label;

  return (
    <Pressable
      style={(state) => [
        styles.base,
        isMobile && styles.baseMobile,
        styles[variant],
        fullWidth && styles.fullWidth,
        (state.pressed || loading) && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled || loading}
      {...props}>
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator size="small" color={spinnerColor(variant)} style={styles.spinner} />
        )}
        <Text style={[styles.label, isMobile && styles.labelMobile, styles[`${variant}Label` as keyof typeof styles]]}>
          {displayLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseMobile: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 12,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: BrandColors.orange,
  },
  secondary: {
    backgroundColor: BrandColors.graphite,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelMobile: {
    fontSize: 16,
  },
  primaryLabel: {
    color: BrandColors.white,
  },
  secondaryLabel: {
    color: BrandColors.white,
  },
  ghostLabel: {
    color: BrandColors.orange,
  },
  outlineLabel: {
    color: BrandColors.textPrimary,
  },
});
