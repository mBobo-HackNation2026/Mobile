/**
 * Paleta eBobo — jedyne miejsce do szybkiej zmiany kolorów marki.
 * Tokeny semantyczne w `colors.ts` budują się z tych wartości.
 *
 * Kierunek: chłodny teal + ciepły bursztyn (akcent UI) + zieleń ZUS (świadczenia).
 * Później można podmienić same hexy poniżej bez ruszania ekranów.
 */
export const palette = {
  /** Główny kolor marki (nawigacja, linki, focus). */
  brand: '#1B6B75',
  brandDark: '#134F56',
  brandMuted: '#5A9AA3',
  brandSoft: '#D8EEF1',
  brandWash: '#EAF5F6',
  /** Delikatnie inny od canvasu — chrome / sticky header. */
  header: '#F1EEE7',

  /** Akcent UI (pasek progresu, wyróżnienia). */
  accent: '#D4A017',
  accentDark: '#A67B0A',
  accentSoft: '#FBF3D9',

  /** Status „sukces” / wykonane (nie mylić z zielenią ZUS). */
  success: '#2F6B4F',
  successSoft: '#E3F0E9',

  /** Zieleń identyfikacji ZUS — CTA świadczeń. */
  zus: '#009639',
  zusDark: '#007A2E',
  zusSoft: '#E6F7ED',

  /** Tła i powierzchnie. */
  canvas: '#F3F7F8',
  canvasWarm: '#EEF4F5',
  surface: '#FFFFFF',
  surfaceMuted: '#E8F0F2',

  /** Obramowania. */
  line: '#D5E1E5',
  lineStrong: '#B7C9CF',

  /** Tekst. */
  ink: '#1A2B33',
  inkSecondary: '#4A5F69',
  inkMuted: '#6B7F88',
  inkInverse: '#FFFFFF',

  /** Stany. */
  warning: '#9A6700',
  warningSoft: '#FFF4D6',
  danger: '#B42318',
  dangerSoft: '#FCEBEA',
  info: '#1D5C8A',
  infoSoft: '#E4F1F9',
  demo: '#7A5B1E',
  demoSoft: '#F7EFD9',

  overlay: 'rgba(26, 43, 51, 0.45)',
  shadow: 'rgba(19, 79, 86, 0.12)',
} as const;

export type PaletteToken = keyof typeof palette;
