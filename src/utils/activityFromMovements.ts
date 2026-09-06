import type { ActivityItem, Movement } from '@/data/types';
import { BrandColors } from '@/constants/colors';
import { parseHoursToMinutes } from '@/utils/calculations';

function formatActivityTime(createdAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 'Agora';

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';

  return created.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function buildActivitiesFromMovements(movements: Movement[]): ActivityItem[] {
  return [...movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((movement) => ({
      id: `a-${movement.id}`,
      title: `${movement.type} registrado para ${movement.employeeName.split(' ')[0]}`,
      detail: movement.value,
      time: formatActivityTime(movement.createdAt),
      icon: movement.type === 'Hora extra' ? '◷' : '◈',
      iconBg:
        movement.type === 'Hora extra'
          ? BrandColors.orangeLight
          : movement.type === 'Vale'
            ? BrandColors.blueLight
            : movement.type === 'Adicional'
              ? BrandColors.greenLight
              : BrandColors.orangeLight,
      iconColor:
        movement.type === 'Hora extra'
          ? BrandColors.orange
          : movement.type === 'Vale'
            ? BrandColors.blue
            : movement.type === 'Adicional'
              ? BrandColors.green
              : BrandColors.orange,
      createdAt: movement.createdAt,
    }));
}

export function valueToDecimalHours(value: string): number | null {
  const minutes = parseHoursToMinutes(value);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
}
