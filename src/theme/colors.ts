import { palette } from '@/theme/palette';

/**
 * Semantyczne tokeny UI.
 * Zmieniaj kolory marki w `palette.ts` — tu tylko mapowanie znaczeń.
 */
export const colors = {
  background: palette.canvas,
  backgroundWarm: palette.canvasWarm,
  surface: palette.surface,
  surfaceMuted: palette.surfaceMuted,
  /** Tło sticky headera — czysta powierzchnia. */
  header: palette.surface,
  border: palette.line,
  borderStrong: palette.lineStrong,

  text: palette.ink,
  textSecondary: palette.inkSecondary,
  textMuted: palette.inkMuted,
  textInverse: palette.inkInverse,

  primary: palette.brand,
  primaryHover: palette.brandDark,
  primarySoft: palette.brandSoft,
  primaryMuted: palette.brandMuted,

  /** Ciepły akcent UI (pasek headera). */
  highlight: palette.accent,
  highlightSoft: palette.accentSoft,

  accent: palette.success,
  accentSoft: palette.successSoft,

  zus: palette.zus,
  zusDark: palette.zusDark,
  zusSoft: palette.zusSoft,

  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,

  demo: palette.demo,
  demoSoft: palette.demoSoft,

  focus: palette.brand,
  overlay: palette.overlay,
  shadow: palette.shadow,
} as const;

export type ColorToken = keyof typeof colors;
