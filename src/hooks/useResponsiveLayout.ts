import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DESKTOP_BREAKPOINT,
  MOBILE_BOTTOM_NAV_HEIGHT,
  MOBILE_BREAKPOINT,
  MOBILE_HORIZONTAL_PADDING,
  MOBILE_SCROLL_BOTTOM_EXTRA,
  TABLET_HORIZONTAL_PADDING,
} from '@/constants/layout';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet = width >= MOBILE_BREAKPOINT && width < DESKTOP_BREAKPOINT;
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  /** Mobile + tablet: nav inferior, sem sidebar. */
  const isCompactLayout = !isDesktop;

  const bottomNavHeight = isCompactLayout ? MOBILE_BOTTOM_NAV_HEIGHT + insets.bottom : 0;
  const contentPaddingHorizontal = isMobile
    ? MOBILE_HORIZONTAL_PADDING
    : isTablet
      ? TABLET_HORIZONTAL_PADDING
      : 32;
  const contentPaddingBottom = isCompactLayout
    ? bottomNavHeight + MOBILE_SCROLL_BOTTOM_EXTRA
    : 48;
  const sectionGap = isMobile ? 16 : isTablet ? 20 : 24;

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    isCompactLayout,
    insets,
    bottomNavHeight,
    contentPaddingHorizontal,
    contentPaddingBottom,
    sectionGap,
  };
}
