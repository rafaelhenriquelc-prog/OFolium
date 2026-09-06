import { Platform, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { BrandColors, Shadows } from '@/constants/colors';
import {
  formatActivityDisplay,
  getActivityIconType,
  ICON_SIZES,
  STAT_SYMBOLS,
} from '@/constants/icons';
import { useAppData } from '@/contexts/AppDataContext';
import { mobileStackedCard } from '@/constants/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const ACTIVITY_ICON_BG = BrandColors.offWhite;
const ACTIVITY_ICON_COLOR = BrandColors.graphite;

export function RecentActivity() {
  const { activities } = useAppData();
  const { isMobile, width } = useResponsiveLayout();
  const stackTime = isMobile || width < 480;

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      <Text style={styles.cardTitle}>Atividade recente</Text>

      {activities.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma movimentação registrada ainda.</Text>
      ) : (
      <View style={styles.activityList}>
        {activities.map((activity, index) => {
          const display = formatActivityDisplay(activity.title, activity.detail);
          const iconType = getActivityIconType(activity.title);

          return (
            <View
              key={activity.id}
              style={[
                styles.activityItem,
                index < activities.length - 1 && styles.activityBorder,
              ]}>
              <View style={styles.iconCircle}>
                <AppIcon
                  name={STAT_SYMBOLS[iconType]}
                  size={ICON_SIZES.activity}
                  color={ACTIVITY_ICON_COLOR}
                />
              </View>

              <View style={styles.activityMain}>
                <View style={[styles.activityTopRow, stackTime && styles.activityTopRowStacked]}>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{display.title}</Text>
                    {display.subtitle && (
                      <Text style={styles.activityDetail}>{display.subtitle}</Text>
                    )}
                  </View>
                  {!stackTime && <Text style={styles.activityTime}>{activity.time}</Text>}
                </View>
                {stackTime && <Text style={styles.activityTimeStacked}>{activity.time}</Text>}
              </View>
            </View>
          );
        })}
      </View>
      )}
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
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.textMuted,
    paddingVertical: 8,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: ACTIVITY_ICON_BG,
  },
  activityMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityTopRowStacked: {
    flexDirection: 'column',
    gap: 2,
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.textPrimary,
  },
  activityDetail: {
    fontSize: 13,
    fontWeight: '400',
    color: BrandColors.textSecondary,
  },
  activityTime: {
    fontSize: 12,
    color: BrandColors.textMuted,
    flexShrink: 0,
    paddingTop: 1,
  },
  activityTimeStacked: {
    fontSize: 12,
    color: BrandColors.textMuted,
    alignSelf: 'flex-end',
  },
});
