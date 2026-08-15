import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Shadows } from '@/constants/colors';
import { useAppData } from '@/contexts/AppDataContext';
import { mobileStackedCard } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function RecentActivity() {
  const { activities } = useAppData();
  const { isMobile } = useResponsiveLayout();

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      <Text style={styles.cardTitle}>Atividade recente</Text>

      <View style={styles.activityList}>
        {activities.map((activity, index) => (
          <View
            key={activity.id}
            style={[
              styles.activityItem,
              isMobile && styles.activityItemMobile,
              index < activities.length - 1 && styles.activityBorder,
            ]}>
            <View style={[styles.iconCircle, { backgroundColor: activity.iconBg }]}>
              <Text style={[styles.icon, { color: activity.iconColor }]}>{activity.icon}</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              {activity.detail && <Text style={styles.activityDetail}>{activity.detail}</Text>}
              {isMobile && <Text style={styles.activityTimeMobile}>{activity.time}</Text>}
            </View>
            {!isMobile && <Text style={styles.activityTime}>{activity.time}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1.5,
    minWidth: 320,
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: BrandColors.border,
    ...(Platform.OS === 'web' ? Shadows.cardWeb : Shadows.card),
  },
  cardMobile: {
    ...mobileStackedCard,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: 20,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  activityItemMobile: {
    alignItems: 'flex-start',
  },
  activityTimeMobile: {
    fontSize: 12,
    color: BrandColors.textMuted,
    marginTop: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.textPrimary,
  },
  activityDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.textSecondary,
  },
  activityTime: {
    fontSize: 12,
    color: BrandColors.textMuted,
    flexShrink: 0,
  },
});
