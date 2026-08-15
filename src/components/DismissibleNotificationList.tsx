import { useMemo, useState, type ReactNode } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AnimatedNotificationCard } from '@/components/AnimatedNotificationCard';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { NotificationItem } from '@/data/types';

type DismissibleNotificationListProps = {
  notifications: NotificationItem[];
  limit?: number;
  listStyle?: StyleProp<ViewStyle>;
  renderCard: (notification: NotificationItem) => ReactNode;
};

export function DismissibleNotificationList({
  notifications,
  limit,
  listStyle,
  renderCard,
}: DismissibleNotificationListProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const visibleNotifications = useMemo(() => {
    const filtered = notifications.filter((item) => !dismissedIds.has(item.id));
    return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
  }, [dismissedIds, limit, notifications]);

  const dismissNotification = (id: string) => {
    setDismissedIds((current) => new Set(current).add(id));
  };

  const listLayout = prefersReducedMotion ? undefined : LinearTransition.duration(200);

  return (
    <Animated.View layout={listLayout} style={[styles.list, listStyle]}>
      {visibleNotifications.map((notification) => (
        <AnimatedNotificationCard
          key={notification.id}
          onDismiss={() => dismissNotification(notification.id)}>
          {renderCard(notification)}
        </AnimatedNotificationCard>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
});
