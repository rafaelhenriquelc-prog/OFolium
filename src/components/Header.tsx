import { useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { HEADER_BELL_ICON } from '@/constants/statIcons';
import { MIN_TOUCH_TARGET, MobileType } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type HeaderProps = {
  onNotificationPress?: () => void;
  isNotificationsPanelOpen?: boolean;
};

export function Header({ onNotificationPress, isNotificationsPanelOpen }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadNotificationCount } = useAppData();
  const { isMobile } = useResponsiveLayout();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Lucas';
  const initials = user?.initials || 'LA';
  const badgeCount = unreadNotificationCount > 0 ? String(unreadNotificationCount) : null;

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }
    router.push('/notifications' as Href);
  };

  const notificationAccessibilityLabel = onNotificationPress
    ? isNotificationsPanelOpen
      ? 'Fechar painel de notificações'
      : 'Abrir painel de notificações'
    : 'Notificações';

  if (isMobile) {
    return (
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <Text style={styles.mobileTitle}>Painel</Text>
          <Text style={styles.mobileGreeting}>Olá, {firstName}</Text>
        </View>

        <Pressable
          {...(onNotificationPress ? ({ dataSet: { notificationsTrigger: 'true' } } as object) : {})}
          style={({ pressed }) => [
            styles.notificationButton,
            styles.notificationButtonMobile,
            pressed && styles.notificationButtonPressed,
          ]}
          onPress={handleNotificationPress}
          accessibilityRole="button"
          accessibilityLabel={notificationAccessibilityLabel}>
          <Image
            source={HEADER_BELL_ICON}
            style={styles.notificationIcon}
            contentFit="contain"
            tintColor={BrandColors.orange}
          />
          {badgeCount && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{badgeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.pageTitle}>Painel</Text>
        <Text style={styles.greeting}>Bom dia, {firstName}! 👋</Text>
        <Text style={styles.subtitle}>Aqui está o resumo da sua equipe hoje.</Text>
      </View>

      <View style={styles.headerRight}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Buscar funcionário..."
            placeholderTextColor={BrandColors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <Pressable
          {...(onNotificationPress ? ({ dataSet: { notificationsTrigger: 'true' } } as object) : {})}
          style={({ pressed }) => [
            styles.notificationButton,
            pressed && styles.notificationButtonPressed,
          ]}
          onPress={handleNotificationPress}
          accessibilityRole="button"
          accessibilityLabel={notificationAccessibilityLabel}>
          <Image
            source={HEADER_BELL_ICON}
            style={styles.notificationIcon}
            contentFit="contain"
            tintColor={BrandColors.orange}
          />
          {badgeCount && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{badgeCount}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    gap: 10,
  },
  mobileHeaderLeft: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  mobileTitle: {
    fontSize: MobileType.pageTitle,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.3,
  },
  mobileGreeting: {
    fontSize: MobileType.bodySmall,
    color: BrandColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 28,
    gap: 24,
    flexWrap: 'wrap',
  },
  headerLeft: {
    gap: 4,
    flex: 1,
    minWidth: 240,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    letterSpacing: -0.3,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    gap: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
    minWidth: 240,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  searchIcon: {
    fontSize: 16,
    color: BrandColors.textMuted,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.textPrimary,
    outlineStyle: 'none' as 'solid',
    minWidth: 160,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
    position: 'relative',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  notificationButtonMobile: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  notificationButtonPressed: {
    opacity: 0.85,
  },
  notificationIcon: {
    width: 16,
    height: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.white,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BrandColors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandColors.white,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.orange,
  },
});
