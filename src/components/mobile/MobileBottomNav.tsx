import { usePathname, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { NavIcon } from '@/components/navigation/NavIcon';
import { MobileMoreMenu } from '@/components/mobile/MobileMoreMenu';
import { BrandColors, Shadows } from '@/constants/colors';
import { MIN_TOUCH_TARGET, MOBILE_BOTTOM_NAV_HEIGHT } from '@/constants/layout';
import {
  isMoreMenuActive,
  isNavItemActive,
  PRIMARY_MOBILE_NAV,
  type NavItem,
} from '@/constants/navigation';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function BottomNavItem({
  item,
  active,
  onPressMore,
}: {
  item: NavItem | { label: string; icon: 'more'; href?: string };
  active: boolean;
  onPressMore?: () => void;
}) {
  const router = useRouter();

  const handlePress = () => {
    if (item.icon === 'more') {
      onPressMore?.();
      return;
    }
    router.push(item.href as Href);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.navItem,
        active && styles.navItemActive,
        pressed && styles.navItemPressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}>
      <NavIcon type={item.icon} active={active} size="sm" />
      <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { insets } = useResponsiveLayout();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = isMoreMenuActive(pathname);

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {PRIMARY_MOBILE_NAV.map((item) => (
          <BottomNavItem key={item.href} item={item} active={isNavItemActive(pathname, item)} />
        ))}
        <BottomNavItem
          item={{ label: 'Mais', icon: 'more' }}
          active={moreActive}
          onPressMore={() => setMoreOpen(true)}
        />
      </View>

      <MobileMoreMenu visible={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: MOBILE_BOTTOM_NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
    backgroundColor: BrandColors.white,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : {}),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: 2,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: BrandColors.orangeLight,
  },
  navItemPressed: {
    opacity: 0.85,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  navLabelActive: {
    color: BrandColors.orange,
    fontWeight: '700',
  },
});
