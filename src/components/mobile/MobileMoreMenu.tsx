import { usePathname, useRouter, type Href } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NavIcon } from '@/components/navigation/NavIcon';
import { BrandColors } from '@/constants/colors';
import { MIN_TOUCH_TARGET } from '@/constants/layout';
import { isNavItemActive, MORE_MENU_NAV, type NavItem } from '@/constants/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/contexts/EmployeesContext';
import { usePlan } from '@/contexts/PlanContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type MobileMoreMenuProps = {
  visible: boolean;
  onClose: () => void;
};

function MenuRow({
  item,
  active,
  onPress,
}: {
  item: NavItem | { label: string; icon: NavItem['icon']; href: string };
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        active && styles.menuItemActive,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <View style={styles.menuIconWrap}>
        <NavIcon type={item.icon} active={active} size="sm" />
      </View>
      <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

export function MobileMoreMenu({ visible, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { activeCount } = useEmployees();
  const { planName, activeLimit, sidebarLinkLabel } = usePlan();
  const { insets } = useResponsiveLayout();

  const navigate = (href: string) => {
    onClose();
    router.push(href as Href);
  };

  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar menu" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.sheetTitle}>Mais opções</Text>

          <View style={styles.planCard}>
            <Text style={styles.planTitle}>{planName}</Text>
            <Text style={styles.planUsage}>
              {activeCount} de {activeLimit} funcionários ativos
            </Text>
          </View>

          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {MORE_MENU_NAV.map((item) => (
              <MenuRow
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item)}
                onPress={() => navigate(item.href)}
              />
            ))}
            <MenuRow
              item={{ label: sidebarLinkLabel, icon: 'chart', href: '/pro' }}
              active={pathname === '/pro'}
              onPress={() => navigate('/pro')}
            />
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta">
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: BrandColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BrandColors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: BrandColors.offWhite,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textPrimary,
  },
  planUsage: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  menuList: {
    maxHeight: 280,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: BrandColors.orangeLight,
  },
  menuItemPressed: {
    opacity: 0.85,
  },
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: BrandColors.textPrimary,
  },
  menuLabelActive: {
    color: BrandColors.orange,
    fontWeight: '700',
  },
  menuChevron: {
    fontSize: 18,
    color: BrandColors.textMuted,
  },
  logoutButton: {
    marginTop: 12,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  logoutButtonPressed: {
    backgroundColor: BrandColors.offWhite,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.red,
  },
});
