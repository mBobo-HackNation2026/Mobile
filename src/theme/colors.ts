import { palette } from '@/theme/palette';

/**
 * Semantyczne tokeny UI (Etap 18).
 * Kolory marki zmieniaj w `palette.ts`.
 */
export const colors = {
  background: palette.canvas,
  backgroundWarm: palette.canvasWarm,
  surface: palette.surface,
  surfaceMuted: palette.surfaceMuted,
  surfaceElevated: palette.surfaceElevated,
  header: palette.header,
  border: palette.line,
  borderStrong: palette.lineStrong,

  text: palette.ink,
  textPrimary: palette.ink,
  textSecondary: palette.inkSecondary,
  textMuted: palette.inkMuted,
  textInverse: palette.inkInverse,

  primary: palette.brand,
  primaryHover: palette.brandDark,
  primarySoft: palette.brandSoft,
  primaryMuted: palette.brandMuted,

  highlight: palette.accent,
  highlightSoft: palette.accentSoft,

  accent: palette.success,
  accentSoft: palette.successSoft,

  success: palette.success,
  successSoft: palette.successSoft,

  zus: palette.zus,
  zusDark: palette.zusDark,
  zusSoft: palette.zusSoft,
  zusNavy: palette.zusNavy,
  zusNavySoft: palette.zusNavySoft,

  health: palette.health,
  healthSoft: palette.healthSoft,
  admin: palette.admin,
  adminSoft: palette.adminSoft,

  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  error: palette.danger,
  errorSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,

  demo: palette.demo,
  demoSoft: palette.demoSoft,

  focus: palette.brand,
  overlay: palette.overlay,
  shadow: palette.shadow,
} as const;

export type ColorToken = keyof typeof colors;
