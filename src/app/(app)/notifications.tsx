import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DismissibleNotificationList } from '@/components/DismissibleNotificationList';
import { Screen } from '@/components/mobile/Screen';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandColors } from '@/constants/colors';
import { MIN_TOUCH_TARGET } from '@/constants/layout';
import { useAppData } from '@/contexts/AppDataContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { NotificationItem } from '@/data/types';

export default function NotificationsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { notifications, unreadNotificationCount, markNotificationRead } = useAppData();
  const { isMobile } = useResponsiveLayout();
  const showUnreadOnly = filter === 'unread';
  const visibleNotifications = showUnreadOnly
    ? notifications.filter((notification) => !notification.read)
    : notifications;

  const subtitle = showUnreadOnly
    ? visibleNotifications.length > 0
      ? `${visibleNotifications.length} ${visibleNotifications.length === 1 ? 'pendente' : 'pendentes'} para conferir`
      : 'Nenhuma notificação pendente no momento.'
    : unreadNotificationCount > 0
      ? `${unreadNotificationCount} não ${unreadNotificationCount === 1 ? 'lida' : 'lidas'}`
      : 'Todas as notificações foram lidas.';

  return (
    <Screen>
      <PageHeader title="Notificações" subtitle={subtitle} />

      {visibleNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
          <Text style={styles.emptyText}>
            {showUnreadOnly
              ? 'Não há notificações pendentes para conferir.'
              : 'Você está em dia com todas as notificações.'}
          </Text>
        </View>
      ) : (
        <DismissibleNotificationList
          notifications={visibleNotifications}
          listStyle={styles.list}
          renderCard={(notification) => (
            <NotificationPageCard
              notification={notification}
              isMobile={isMobile}
              onMarkRead={() => markNotificationRead(notification.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function NotificationPageCard({
  notification,
  isMobile,
  onMarkRead,
}: {
  notification: NotificationItem;
  isMobile: boolean;
  onMarkRead: () => void;
}) {
  return (
    <Card style={[styles.notificationCard, !notification.read && styles.notificationUnread]}>
      <View style={[styles.notificationRow, isMobile && styles.notificationRowMobile]}>
        {!notification.read && (
          <View style={[styles.dot, { backgroundColor: notification.dotColor }]} />
        )}
        <View style={styles.notificationContent}>
          <Text style={[styles.title, !notification.read && styles.titleUnread]}>
            {notification.title}
          </Text>
          <Text style={styles.description}>{notification.description}</Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>
        <View style={[styles.statusBadge, notification.read ? styles.statusRead : styles.statusNew]}>
          <Text style={[styles.statusText, notification.read ? styles.statusTextRead : styles.statusTextNew]}>
            {notification.read ? 'Lida' : 'Nova'}
          </Text>
        </View>
      </View>
      {!notification.read && (
        <Pressable
          style={({ pressed }) => [styles.markReadButton, pressed && styles.markReadPressed]}
          onPress={onMarkRead}
          accessibilityRole="button"
          accessibilityLabel="Marcar como lida">
          <Text style={styles.markRead}>Marcar como lida</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: BrandColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: { padding: 20 },
  notificationUnread: {
    borderColor: 'rgba(255, 92, 0, 0.15)',
    backgroundColor: BrandColors.orangeCream,
  },
  notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notificationRowMobile: { flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  notificationContent: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', color: BrandColors.textPrimary },
  titleUnread: { fontWeight: '700' },
  description: { fontSize: 14, color: BrandColors.textSecondary, lineHeight: 20 },
  time: { fontSize: 12, color: BrandColors.textMuted, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusNew: { backgroundColor: BrandColors.orangeLight },
  statusRead: { backgroundColor: BrandColors.offWhite },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextNew: { color: BrandColors.orange },
  statusTextRead: { color: BrandColors.textMuted },
  markReadButton: {
    marginTop: 12,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  markReadPressed: {
    opacity: 0.85,
  },
  markRead: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.orange,
  },
});
