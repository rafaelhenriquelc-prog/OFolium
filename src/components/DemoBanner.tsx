import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/colors';
import { DEMO_LABEL } from '@/constants/demo';

type DemoBannerProps = {
  variant?: 'auth' | 'app';
};

export function DemoBanner({ variant = 'app' }: DemoBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.banner,
        variant === 'app' && styles.bannerApp,
        variant === 'app' && { paddingTop: Math.max(insets.top, 8) },
        variant === 'auth' && styles.bannerAuth,
      ]}>
      <Text style={[styles.text, variant === 'auth' && styles.textAuth]}>{DEMO_LABEL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(255, 92, 0, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 92, 0, 0.25)',
    paddingBottom: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { userSelect: 'none' as const } : {}),
  },
  bannerApp: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  bannerAuth: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 92, 0, 0.18)',
    borderBottomColor: 'rgba(255, 92, 0, 0.35)',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.3,
    color: BrandColors.orange,
    textTransform: 'uppercase',
  },
  textAuth: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
