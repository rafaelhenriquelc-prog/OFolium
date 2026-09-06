import type { SymbolViewProps } from 'expo-symbols';

import type { NavIconType } from '@/constants/navigation';

export type AppSymbolName = NonNullable<SymbolViewProps['name']>;

export const NAV_SYMBOLS: Record<NavIconType, AppSymbolName> = {
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  people: { ios: 'person.2', android: 'groups', web: 'groups' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  cash: { ios: 'wallet.pass', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  chart: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  settings: { ios: 'person.crop.circle', android: 'manage_accounts', web: 'manage_accounts' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  pro: { ios: 'star', android: 'workspace_premium', web: 'workspace_premium' },
};

export type StatIconType =
  | 'activeEmployees'
  | 'monthForecast'
  | 'overtime'
  | 'pending'
  | 'employeesReviewed'
  | 'vales'
  | 'absences'
  | 'additions';

export const STAT_SYMBOLS: Record<StatIconType, AppSymbolName> = {
  activeEmployees: { ios: 'person.2', android: 'groups', web: 'groups' },
  monthForecast: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' },
  overtime: { ios: 'clock', android: 'more_time', web: 'more_time' },
  pending: { ios: 'list.clipboard', android: 'assignment_late', web: 'assignment_late' },
  employeesReviewed: { ios: 'person.crop.circle.badge.checkmark', android: 'person_check', web: 'person_check' },
  vales: { ios: 'wallet.pass', android: 'receipt_long', web: 'receipt_long' },
  absences: { ios: 'calendar.badge.exclamationmark', android: 'event_busy', web: 'event_busy' },
  additions: { ios: 'plus.circle', android: 'add_circle', web: 'add_circle' },
};

export const ICON_SIZES = {
  sidebar: 24,
  sidebarCompact: 22,
  statCard: 26,
  statCardCompact: 22,
  activity: 18,
} as const;

export type ActivityIconType = Extract<StatIconType, 'vales' | 'overtime' | 'additions'>;

export function getActivityIconType(title: string): ActivityIconType {
  const normalized = title.toLowerCase();
  if (normalized.startsWith('vale')) return 'vales';
  if (normalized.startsWith('hora extra')) return 'overtime';
  if (normalized.startsWith('adicional')) return 'additions';
  return 'vales';
}

export function formatActivityDisplay(
  title: string,
  detail?: string,
): { title: string; subtitle?: string } {
  const match = title.match(/^(.+?)\s+para\s+(.+)$/i);
  if (match) {
    const displayTitle = match[1].trim();
    const name = match[2].trim();
    return {
      title: displayTitle,
      subtitle: detail ? `${name} • ${detail}` : name,
    };
  }
  return { title, subtitle: detail };
}
