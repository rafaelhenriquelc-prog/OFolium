import { Image } from 'expo-image';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { MOBILE_BREAKPOINT, MOBILE_HORIZONTAL_PADDING, MobileSpace, MobileType } from '@/constants/layout';

/** Largura máxima do card de login em celulares maiores. */
const LOGIN_CARD_MAX_WIDTH = 400;

type AuthLayoutProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Layout mais compacto — usar apenas na tela de login mobile. */
  compactMobile?: boolean;
  /** Fundo geométrico exclusivo da tela de login. */
  geometricBackground?: boolean;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  compactMobile,
  geometricBackground = false,
}: AuthLayoutProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const compact = isMobile && compactMobile;

  const scrollView = (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        geometricBackground && styles.scrollContentTransparent,
        isMobile && !compact && styles.scrollContentMobile,
        compact && styles.scrollContentCompact,
        compact && { minHeight: height },
      ]}
      style={
        geometricBackground
          ? [styles.root, styles.rootTransparent, styles.foregroundScroll]
          : styles.root
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.container,
          isMobile && styles.containerMobile,
          compact && styles.containerCompact,
        ]}>
        <Image
          source={require('@/assets/images/logo-ofolium.png')}
          style={[styles.logo, isMobile && styles.logoMobile, compact && styles.logoCompact]}
          contentFit="contain"
        />

        {title && (
          <Text style={[styles.tagline, isMobile && styles.taglineMobile, compact && styles.taglineCompact]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, isMobile && styles.subtitleMobile, compact && styles.subtitleCompact]}>
            {subtitle}
          </Text>
        )}

        <View style={[styles.card, isMobile && styles.cardMobile, compact && styles.cardCompact]}>
          {children}
        </View>

        {footer && (
          <View style={[styles.footer, isMobile && styles.footerMobile, compact && styles.footerCompact]}>
            {footer}
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (!geometricBackground) {
    return scrollView;
  }

  return (
    <View style={styles.backgroundRoot}>
      <Image
        source={require('@/assets/images/fundo_geo1.png')}
        style={styles.backgroundImage}
        contentFit="cover"
        contentPosition="center"
      />
      <View pointerEvents="none" style={styles.backgroundOverlay} />
      {scrollView}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundRoot: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100vh' as unknown as number,
          height: '100vh' as unknown as number,
        } as object)
      : {}),
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
    zIndex: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 1,
  },
  foregroundScroll: {
    zIndex: 2,
  },
  root: {
    flex: 1,
    backgroundColor: BrandColors.graphite,
  },
  rootTransparent: {
    backgroundColor: 'transparent',
  },
  scrollContentTransparent: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 36,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  scrollContentMobile: {
    justifyContent: 'flex-start',
    paddingHorizontal: MOBILE_HORIZONTAL_PADDING,
    paddingVertical: 24,
  },
  scrollContentCompact: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: MOBILE_HORIZONTAL_PADDING,
    paddingVertical: 16,
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100dvh' as unknown as number,
          display: 'flex',
          flexDirection: 'column',
        } as object)
      : {}),
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 8,
  },
  containerMobile: {
    maxWidth: '100%',
    gap: 4,
  },
  containerCompact: {
    maxWidth: LOGIN_CARD_MAX_WIDTH,
    gap: 0,
    width: '100%',
  },
  logo: {
    width: 180,
    height: 40,
    marginBottom: 16,
  },
  logoMobile: {
    width: 140,
    height: 32,
    marginBottom: 8,
  },
  logoCompact: {
    width: 112,
    height: 26,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.white,
    textAlign: 'center',
    marginTop: 4,
  },
  taglineMobile: {
    fontSize: MobileType.sectionTitle,
    marginTop: 0,
  },
  taglineCompact: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitleMobile: {
    fontSize: MobileType.bodySmall,
    marginBottom: 10,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 10,
  },
  card: {
    width: '100%',
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: 16,
    marginTop: 8,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardMobile: {
    padding: MobileSpace.cardPadding + 2,
    gap: MobileSpace.fieldGap,
    marginTop: 4,
    borderRadius: 14,
  },
  cardCompact: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    marginTop: 0,
    borderRadius: 12,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  footerMobile: {
    marginTop: 14,
    gap: 8,
  },
  footerCompact: {
    marginTop: 10,
    gap: 0,
    width: '100%',
  },
});
