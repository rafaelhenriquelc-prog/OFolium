import { Platform, type ViewStyle } from 'react-native';

/** Abaixo disso: layout mobile compacto. */
export const MOBILE_BREAKPOINT = 768;

/** Abaixo disso: sidebar oculta, nav inferior (mobile + tablet). */
export const DESKTOP_BREAKPOINT = 1024;

export const MOBILE_BOTTOM_NAV_HEIGHT = 52;

export const MOBILE_HORIZONTAL_PADDING = 16;

export const TABLET_HORIZONTAL_PADDING = 24;

/** Espaço extra abaixo do conteúdo para não ficar atrás da barra inferior. */
export const MOBILE_SCROLL_BOTTOM_EXTRA = 20;

export const MIN_TOUCH_TARGET = 44;

/** Tipografia compacta — mobile (< 768px). */
export const MobileType = {
  pageTitle: 26,
  sectionTitle: 18,
  cardTitle: 16,
  body: 15,
  bodySmall: 14,
  caption: 12,
  statValue: 22,
  input: 16,
} as const;

/** Espaçamentos compactos — mobile. */
export const MobileSpace = {
  section: 16,
  cardPadding: 14,
  cardGap: 12,
  fieldGap: 12,
} as const;

/** Largura mínima de card de indicador no carrossel mobile (cabe valores monetários completos). */
export const MOBILE_STAT_CARD_WIDTH = 172;

/** Remove flex-grow em cards empilhados no mobile/tablet para evitar sobreposição. */
export const mobileStackedCard: ViewStyle = {
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto',
  width: '100%',
  minWidth: 0,
  alignSelf: 'stretch',
};

export const mobileStackedSection: ViewStyle = {
  width: '100%',
  flexGrow: 0,
  flexShrink: 0,
};

/** Evita rolagem horizontal acidental na página (web mobile/tablet). */
export const mobilePageContain: ViewStyle =
  Platform.OS === 'web'
    ? ({
        overflowX: 'hidden',
        maxWidth: '100%',
      } as ViewStyle)
    : {};
