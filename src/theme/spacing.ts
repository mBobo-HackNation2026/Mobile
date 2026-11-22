/** Skala odstępów: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  mdPlus: 20,
  lg: 24,
  xl: 32,
  xlPlus: 40,
  xxl: 48,
} as const;

/** Ujednolicone zaokrąglenia (Etap 18). */
export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const layout = {
  contentMaxWidth: 720,
  contentMaxWidthWide: 960,
  sidebarWidth: 252,
  sidebarWidthMedium: 88,
  touchMin: 44,
  navMaxWidth: 480,
} as const;
