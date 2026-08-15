export const BrandColors = {
  orange: '#FF5C00',
  orangeLight: 'rgba(255, 92, 0, 0.10)',
  orangeMuted: 'rgba(255, 92, 0, 0.06)',
  orangeCream: '#FFF8F3',

  white: '#FFFFFF',
  offWhite: '#F7F7F8',
  background: '#F4F4F6',

  graphite: '#1C1C1E',
  graphiteLight: '#2C2C2E',
  black: '#111111',

  textPrimary: '#111111',
  textSecondary: '#6B6B76',
  textMuted: '#9B9BA6',

  border: '#EBEBEF',
  borderLight: '#F0F0F3',

  green: '#22A06B',
  greenLight: 'rgba(34, 160, 107, 0.10)',
  red: '#E5484D',
  redLight: 'rgba(229, 72, 77, 0.10)',
  amber: '#F5A623',
  amberLight: 'rgba(245, 166, 35, 0.10)',
  blue: '#3B82F6',
  blueLight: 'rgba(59, 130, 246, 0.10)',
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardWeb: {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
  },
} as const;
