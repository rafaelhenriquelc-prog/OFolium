import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DismissibleNotificationList } from '@/components/DismissibleNotificationList';
import { panelNotificationCardStyle } from '@/components/AnimatedNotificationCard';
import { BrandColors, Shadows } from '@/constants/colors';
import { DESKTOP_BREAKPOINT } from '@/constants/layout';
import { useAppData } from '@/contexts/AppDataContext';
import type { NotificationItem } from '@/data/types';

const PANEL_WIDTH = 320;
const COLLAPSED_WIDTH = 12;
const EDGE_TOGGLE_SIZE = { width: 28, height: 44 };

/** Painel lateral só em desktop (≥ 1024px). Abaixo disso: drawer/modal. */
export const NOTIFICATIONS_PANEL_BREAKPOINT = DESKTOP_BREAKPOINT;

type NotificationsPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isCompact: boolean;
};

function PanelNotificationCard({ notification }: { notification: NotificationItem }) {
  return (
    <View style={panelNotificationCardStyle.card}>
      <View style={[panelNotificationCardStyle.dot, { backgroundColor: notification.dotColor }]} />
      <View style={panelNotificationCardStyle.content}>
        <Text style={panelNotificationCardStyle.title}>{notification.title}</Text>
        <Text style={panelNotificationCardStyle.description}>{notification.description}</Text>
        <Text style={panelNotificationCardStyle.time}>{notification.time}</Text>
      </View>
    </View>
  );
}

function NotificationPreviewList() {
  const { notifications } = useAppData();

  return (
    <DismissibleNotificationList
      notifications={notifications}
      limit={3}
      listStyle={styles.notificationsList}
      renderCard={(notification) => <PanelNotificationCard notification={notification} />}
    />
  );
}

function PanelHeader({ onSeeAll, onClose, showCloseButton }: { onSeeAll: () => void; onClose?: () => void; showCloseButton?: boolean }) {
  return (
    <View style={styles.panelHeader}>
      <Text style={styles.panelTitle}>Notificações</Text>
      <View style={styles.panelHeaderActions}>
        <Pressable onPress={onSeeAll} accessibilityRole="link" accessibilityLabel="Ver todas as notificações">
          <Text style={styles.seeAll}>Ver todas</Text>
        </Pressable>
        {showCloseButton && onClose && (
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.togglePressed]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar notificações">
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EdgeToggleButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.edgeToggle, pressed && styles.togglePressed]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={isOpen ? 'Recolher notificações' : 'Abrir notificações'}>
      <Text style={styles.edgeToggleArrow} accessibilityElementsHidden importantForAccessibility="no">
        {isOpen ? '›' : '‹'}
      </Text>
    </Pressable>
  );
}

function NotificationsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(PANEL_WIDTH, width * 0.88);

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.drawerBackdrop} onPress={onClose} accessibilityLabel="Fechar notificações">
        <Pressable
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal>
          <PanelHeader
            onSeeAll={() => {
              onClose();
              router.push('/notifications' as Href);
            }}
            onClose={onClose}
            showCloseButton
          />
          <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScroll}>
            <NotificationPreviewList />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DesktopNotificationsPanel({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const router = useRouter();
  const panelWidth = useSharedValue(isOpen ? PANEL_WIDTH : COLLAPSED_WIDTH);

  useEffect(() => {
    panelWidth.value = withTiming(isOpen ? PANEL_WIDTH : COLLAPSED_WIDTH, { duration: 220 });
  }, [isOpen, panelWidth]);

  const containerStyle = useAnimatedStyle(() => ({
    width: panelWidth.value,
  }));

  const handleSeeAll = () => router.push('/notifications' as Href);

  return (
    <Animated.View
      {...({ dataSet: { notificationsPanel: 'true' } } as object)}
      nativeID="notifications-panel"
      style={[styles.desktopContainer, containerStyle]}>
      <EdgeToggleButton isOpen={isOpen} onToggle={onToggle} />

      {isOpen && (
        <View style={styles.panel}>
          <PanelHeader onSeeAll={handleSeeAll} />
          <NotificationPreviewList />
        </View>
      )}
    </Animated.View>
  );
}

export function NotificationsPanel({ isOpen, onToggle, onClose, isCompact }: NotificationsPanelProps) {
  if (isCompact) {
    return <NotificationsDrawer isOpen={isOpen} onClose={onClose} />;
  }

  return <DesktopNotificationsPanel isOpen={isOpen} onToggle={onToggle} />;
}

const styles = StyleSheet.create({
  desktopContainer: {
    flexShrink: 0,
    overflow: 'visible',
    position: 'relative',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  edgeToggle: {
    position: 'absolute',
    left: -EDGE_TOGGLE_SIZE.width / 2,
    top: '50%',
    width: EDGE_TOGGLE_SIZE.width,
    height: EDGE_TOGGLE_SIZE.height,
    marginTop: -EDGE_TOGGLE_SIZE.height / 2,
    borderRadius: 8,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  edgeToggleArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    lineHeight: 20,
  },
  panel: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 24,
    paddingTop: 32,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  panelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    flexShrink: 0,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.orange,
    flexShrink: 0,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.offWhite,
  },
  closeIcon: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  notificationsList: {
    gap: 12,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  drawer: {
    height: '100%',
    backgroundColor: BrandColors.background,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  drawerScroll: {
    flex: 1,
  },
  togglePressed: {
    opacity: 0.85,
  },
});
