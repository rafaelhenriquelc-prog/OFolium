import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/colors';
import type { NavIconType } from '@/constants/navigation';

const NAV_IMAGE_ICONS = {
  bell: require('@/assets/images/sidebar/sino.png'),
  settings: require('@/assets/images/sidebar/engrenagem.png'),
} as const;

type NavIconProps = {
  type: NavIconType;
  active?: boolean;
  color?: string;
  size?: 'sm' | 'md';
};

function NavImageIcon({ type, color }: { type: 'bell' | 'settings'; color: string }) {
  return (
    <Image
      source={NAV_IMAGE_ICONS[type]}
      style={styles.navImageIcon}
      contentFit="contain"
      tintColor={color}
    />
  );
}

export function NavIcon({ type, active = false, color, size = 'md' }: NavIconProps) {
  const resolvedColor =
    color ?? (active ? BrandColors.orange : size === 'sm' ? BrandColors.textMuted : 'rgba(255, 255, 255, 0.55)');

  switch (type) {
    case 'grid':
      return (
        <View style={styles.iconGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.iconGridCell, { backgroundColor: resolvedColor }]} />
          ))}
        </View>
      );
    case 'people':
      return (
        <View style={styles.iconPeople}>
          <View style={[styles.iconPeopleHead, { backgroundColor: resolvedColor }]} />
          <View style={[styles.iconPeopleBody, { backgroundColor: resolvedColor }]} />
        </View>
      );
    case 'calendar':
      return (
        <View style={[styles.iconCalendar, { borderColor: resolvedColor }]}>
          <View style={[styles.iconCalendarTop, { backgroundColor: resolvedColor }]} />
          <View style={styles.iconCalendarBody}>
            <View style={[styles.iconCalendarDot, { backgroundColor: resolvedColor }]} />
            <View style={[styles.iconCalendarDot, { backgroundColor: resolvedColor }]} />
          </View>
        </View>
      );
    case 'cash':
      return (
        <View style={[styles.iconCash, { borderColor: resolvedColor }]}>
          <Text style={[styles.iconCashText, { color: resolvedColor }]}>$</Text>
        </View>
      );
    case 'chart':
      return (
        <View style={styles.iconChart}>
          <View style={[styles.iconChartBar, styles.iconChartBarSm, { backgroundColor: resolvedColor }]} />
          <View style={[styles.iconChartBar, styles.iconChartBarMd, { backgroundColor: resolvedColor }]} />
          <View style={[styles.iconChartBar, styles.iconChartBarLg, { backgroundColor: resolvedColor }]} />
        </View>
      );
    case 'bell':
      return <NavImageIcon type="bell" color={resolvedColor} />;
    case 'settings':
      return <NavImageIcon type="settings" color={resolvedColor} />;
    case 'more':
      return (
        <View style={styles.iconMore}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.iconMoreDot, { backgroundColor: resolvedColor }]} />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  navImageIcon: {
    width: 16,
    height: 16,
  },
  iconGrid: {
    width: 16,
    height: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  iconGridCell: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  iconPeople: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconPeopleHead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  iconPeopleBody: {
    width: 12,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  iconCalendar: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  iconCalendarTop: {
    height: 4,
  },
  iconCalendarBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 1,
  },
  iconCalendarDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  iconCash: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCashText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  iconChart: {
    width: 16,
    height: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  iconChartBar: {
    width: 3,
    borderRadius: 1,
  },
  iconChartBarSm: { height: 6 },
  iconChartBarMd: { height: 10 },
  iconChartBarLg: { height: 14 },
  iconMore: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconMoreDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
