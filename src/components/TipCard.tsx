import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { usePlan } from '@/contexts/PlanContext';
import { mobileStackedCard } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function TipCard() {
  const router = useRouter();
  const { isPro } = usePlan();
  const { isMobile } = useResponsiveLayout();
  const [isFocused, setIsFocused] = useState(false);

  const handleReviewPress = () => {
    const href = (isPro ? '/closings?filter=pending' : '/notifications?filter=unread') as Href;
    router.push(href);
  };

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      <View style={styles.illustration}>
        <View style={styles.docIcon}>
          <View style={styles.docLine} />
          <View style={[styles.docLine, styles.docLineShort]} />
          <View style={[styles.docLine, styles.docLineMedium]} />
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.cardTitle}>Dica do ofolium</Text>
        <Text style={styles.description}>
          Mantenha os registros da sua equipe atualizados para facilitar o fechamento do mês.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revisar registros pendentes"
          onPress={handleReviewPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={({ pressed, hovered }) => [
            styles.button,
            (pressed || hovered) && styles.buttonHovered,
            isFocused && styles.buttonFocused,
          ]}>
          <Text style={styles.buttonText}>Revisar registros</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 260,
    backgroundColor: BrandColors.orangeCream,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 0, 0.08)',
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardMobile: {
    ...mobileStackedCard,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
  },
  illustration: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docIcon: {
    width: 48,
    height: 56,
    backgroundColor: BrandColors.white,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 0, 0.12)',
    position: 'relative',
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  docLine: {
    height: 3,
    backgroundColor: 'rgba(255, 92, 0, 0.20)',
    borderRadius: 2,
    marginBottom: 5,
  },
  docLineShort: {
    width: '60%',
  },
  docLineMedium: {
    width: '80%',
  },
  checkCircle: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.white,
  },
  content: {
    flex: 1,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  description: {
    fontSize: 13,
    color: BrandColors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: BrandColors.orange,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  buttonHovered: {
    opacity: 0.92,
  },
  buttonFocused: {
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 2,
          outlineColor: BrandColors.orange,
          outlineStyle: 'solid' as const,
          outlineOffset: 2,
        }
      : {}),
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.white,
  },
});
