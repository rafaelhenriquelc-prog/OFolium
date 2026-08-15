export type NavIconType = 'grid' | 'people' | 'calendar' | 'cash' | 'chart' | 'bell' | 'settings' | 'more';

export type NavItem = {
  label: string;
  icon: NavIconType;
  href: string;
  matchPaths?: string[];
};

export const PRIMARY_MOBILE_NAV: NavItem[] = [
  { label: 'Painel', icon: 'grid', href: '/dashboard' },
  { label: 'Funcionários', icon: 'people', href: '/employees', matchPaths: ['/employees'] },
  { label: 'Calendário', icon: 'calendar', href: '/calendar' },
  { label: 'Fechamentos', icon: 'cash', href: '/closings' },
];

export const MAIN_DESKTOP_NAV: NavItem[] = [
  ...PRIMARY_MOBILE_NAV,
  { label: 'Relatórios', icon: 'chart', href: '/reports' },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: 'Notificações', icon: 'bell', href: '/notifications' },
  { label: 'Configurações', icon: 'settings', href: '/settings' },
];

export const MORE_MENU_NAV: NavItem[] = [
  { label: 'Relatórios', icon: 'chart', href: '/reports' },
  ...SECONDARY_NAV,
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.matchPaths) {
    return item.matchPaths.some((path) => pathname.startsWith(path));
  }
  return false;
}

export function isMoreMenuActive(pathname: string): boolean {
  return MORE_MENU_NAV.some((item) => isNavItemActive(pathname, item)) || pathname === '/pro';
}
