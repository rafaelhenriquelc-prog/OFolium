import { Image } from 'expo-image';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { NavIcon } from '@/components/navigation/NavIcon';
import { BrandColors, Shadows } from '@/constants/colors';
import {
  SIDEBAR_EDGE_TOGGLE,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from '@/constants/layout';
import { isNavItemActive, MAIN_DESKTOP_NAV, SECONDARY_NAV, type NavItem } from '@/constants/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function NavButton({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.navItem,
        collapsed && styles.navItemCollapsed,
        active && styles.navItemActive,
        pressed && styles.navItemPressed,
      ]}
      onPress={() => router.push(item.href as Href)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}>
      {active && <View style={[styles.activeIndicator, collapsed && styles.activeIndicatorCollapsed]} />}
      <View style={styles.navIconWrap}>
        <NavIcon type={item.icon} active={active} />
      </View>
      {!collapsed && <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>}
    </Pressable>
  );
}

function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.edgeToggle, pressed && styles.edgeTogglePressed]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}>
      <Text style={styles.edgeToggleArrow} accessibilityElementsHidden importantForAccessibility="no">
        {collapsed ? '›' : '‹'}
      </Text>
    </Pressable>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isCompactLayout } = useResponsiveLayout();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const chevronRotation = useSharedValue(0);
  const sidebarWidth = useSharedValue(collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED);

  useEffect(() => {
    sidebarWidth.value = withTiming(collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED, {
      duration: 220,
    });
  }, [collapsed, sidebarWidth]);

  useEffect(() => {
    chevronRotation.value = withTiming(menuOpen ? 180 : 0, { duration: 200 });
  }, [menuOpen, chevronRotation]);

  useEffect(() => {
    if (collapsed) {
      setMenuOpen(false);
    }
  }, [collapsed]);

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  const { activeCount } = useEmployees();
  const { planName, activeLimit, sidebarLinkLabel } = usePlan();

  if (isCompactLayout) {
    return null;
  }

  const displayName = user?.name || 'Lucas Almeida';
  const displayRole = user?.role || 'Administrador';
  const displayInitials = user?.initials || 'LA';
  const isProRouteActive = pathname === '/pro';

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const planPercent = Math.round((activeCount / activeLimit) * 100);

  return (
    <Animated.View style={[styles.sidebarShell, sidebarAnimatedStyle]}>
      <View style={styles.sidebar}>
        {!collapsed ? (
          <Pressable
            style={({ pressed }) => [styles.logoContainer, pressed && styles.logoPressed]}
            onPress={() => router.push('/dashboard' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Ir para o Painel">
            <Image
              source={require('@/assets/images/logo-ofolium.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Pressable>
        ) : null}

        <View style={[styles.navSection, collapsed && styles.navSectionCollapsed]}>
          {MAIN_DESKTOP_NAV.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              active={isNavItemActive(pathname, item)}
              collapsed={collapsed}
            />
          ))}
        </View>

        {!collapsed && <View style={styles.divider} />}

        <View style={[styles.navSection, collapsed && styles.navSectionCollapsed]}>
          {SECONDARY_NAV.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              active={isNavItemActive(pathname, item)}
              collapsed={collapsed}
            />
          ))}
        </View>

        <View style={[styles.bottomSection, collapsed && styles.bottomSectionCollapsed]}>
          {collapsed ? (
            <Pressable
              style={({ pressed }) => [
                styles.proIconButton,
                isProRouteActive && styles.proIconButtonActive,
                pressed && styles.proIconButtonPressed,
              ]}
              onPress={() => router.push('/pro' as Href)}
              accessibilityRole="button"
              accessibilityLabel={sidebarLinkLabel}
              accessibilityState={{ selected: isProRouteActive }}>
              <NavIcon type="chart" active={isProRouteActive} />
            </Pressable>
          ) : (
            <View style={styles.planCard}>
              <Text style={styles.planTitle}>{planName}</Text>
              <Text style={styles.planUsage}>
                {activeCount} de {activeLimit} funcionários ativos
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(planPercent, 100)}%` }]} />
              </View>
              <Pressable
                style={({ pressed }) => [styles.proLink, pressed && styles.proLinkPressed]}
                onPress={() => router.push('/pro' as Href)}>
                <Text style={styles.proLinkText}>{sidebarLinkLabel}</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.userMenuWrapper, collapsed && styles.userMenuWrapperCollapsed]}>
            {menuOpen && (
              <View style={[styles.userMenu, collapsed && styles.userMenuCollapsed]}>
                {collapsed && (
                  <Pressable
                    style={({ pressed }) => [styles.userMenuItem, pressed && styles.userMenuItemPressed]}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push('/pro' as Href);
                    }}>
                    <Text style={styles.userMenuItemText}>{sidebarLinkLabel}</Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [styles.userMenuItem, pressed && styles.userMenuItemPressed]}
                  onPress={handleLogout}>
                  <Text style={styles.userMenuItemText}>Sair</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.userSection,
                collapsed && styles.userSectionCollapsed,
                pressed && styles.userSectionPressed,
              ]}
              onPress={() => setMenuOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel={collapsed ? `Menu de ${displayName}` : undefined}
              accessibilityState={{ expanded: menuOpen }}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{displayInitials}</Text>
              </View>
              {!collapsed && (
                <>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userRole}>{displayRole}</Text>
                  </View>
                  <Animated.View style={[styles.chevronWrap, chevronAnimatedStyle]}>
                    <Text style={[styles.userChevron, menuOpen && styles.userChevronOpen]}>▾</Text>
                  </Animated.View>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <SidebarToggle collapsed={collapsed} onToggle={onToggle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebarShell: {
    flexShrink: 0,
    position: 'relative',
    overflow: 'visible',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  sidebar: {
    flex: 1,
    backgroundColor: BrandColors.graphite,
    paddingVertical: 24,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  edgeToggle: {
    position: 'absolute',
    right: -SIDEBAR_EDGE_TOGGLE.width / 2,
    top: '50%',
    width: SIDEBAR_EDGE_TOGGLE.width,
    height: SIDEBAR_EDGE_TOGGLE.height,
    marginTop: -SIDEBAR_EDGE_TOGGLE.height / 2,
    borderRadius: 8,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  edgeTogglePressed: {
    opacity: 0.85,
  },
  edgeToggleArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    lineHeight: 20,
  },
  logoContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  logoPressed: {
    opacity: 0.85,
  },
  logo: {
    width: 160,
    height: 36,
  },
  navSection: {
    paddingHorizontal: 12,
    gap: 2,
  },
  navSectionCollapsed: {
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    position: 'relative',
    minHeight: 42,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  navItemActive: {
    backgroundColor: BrandColors.orangeLight,
  },
  navItemPressed: {
    opacity: 0.8,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: BrandColors.orange,
    borderRadius: 2,
  },
  activeIndicatorCollapsed: {
    left: 4,
    top: 6,
    bottom: 6,
  },
  navIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  navLabelActive: {
    color: BrandColors.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
    marginHorizontal: 20,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    gap: 16,
  },
  bottomSectionCollapsed: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 12,
  },
  planCard: {
    backgroundColor: BrandColors.graphiteLight,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.white,
  },
  planUsage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.orange,
    borderRadius: 2,
  },
  proLink: {
    marginTop: 4,
  },
  proLinkPressed: {
    opacity: 0.7,
  },
  proLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.orange,
  },
  proIconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proIconButtonActive: {
    backgroundColor: BrandColors.orangeLight,
  },
  proIconButtonPressed: {
    opacity: 0.8,
  },
  userMenuWrapper: {
    gap: 8,
  },
  userMenuWrapperCollapsed: {
    alignItems: 'center',
    zIndex: 20,
  },
  userMenu: {
    backgroundColor: BrandColors.graphiteLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  userMenuCollapsed: {
    position: 'absolute',
    left: '100%',
    bottom: 0,
    marginLeft: 8,
    minWidth: 180,
    zIndex: 30,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  userMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userMenuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  userMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.white,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  userSectionCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  userSectionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.orange,
  },
  userInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.white,
  },
  userRole: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  userChevron: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
  },
  chevronWrap: {
    flexShrink: 0,
  },
  userChevronOpen: {
    color: BrandColors.orange,
  },
});
