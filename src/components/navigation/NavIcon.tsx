import { AppIcon } from '@/components/ui/AppIcon';
import { BrandColors } from '@/constants/colors';
import { ICON_SIZES, NAV_SYMBOLS } from '@/constants/icons';
import type { NavIconType } from '@/constants/navigation';

type NavIconProps = {
  type: NavIconType;
  active?: boolean;
  color?: string;
  size?: 'sm' | 'md';
};

export function NavIcon({ type, active = false, color, size = 'md' }: NavIconProps) {
  const iconSize = size === 'sm' ? ICON_SIZES.sidebarCompact : ICON_SIZES.sidebar;
  const resolvedColor =
    color ??
    (active
      ? BrandColors.orange
      : size === 'sm'
        ? BrandColors.textMuted
        : 'rgba(255, 255, 255, 0.55)');

  return <AppIcon name={NAV_SYMBOLS[type]} size={iconSize} color={resolvedColor} />;
}
