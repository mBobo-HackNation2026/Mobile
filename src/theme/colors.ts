export const colors = {
  background: '#F5F8F9',
  backgroundWarm: '#EEF4F5',
  surface: '#FFFFFF',
  surfaceMuted: '#E8F0F2',
  border: '#D5E1E5',
  borderStrong: '#B7C9CF',

  text: '#1A2B33',
  textSecondary: '#4A5F69',
  textMuted: '#6B7F88',
  textInverse: '#FFFFFF',

  primary: '#1B6B75',
  primaryHover: '#15565E',
  primarySoft: '#D8EEF1',
  primaryMuted: '#A8D0D6',

  accent: '#2F6B4F',
  accentSoft: '#E3F0E9',

  warning: '#9A6700',
  warningSoft: '#FFF4D6',
  danger: '#B42318',
  dangerSoft: '#FCEBEA',
  info: '#1D5C8A',
  infoSoft: '#E4F1F9',

  demo: '#7A5B1E',
  demoSoft: '#F7EFD9',

  focus: '#1B6B75',
  overlay: 'rgba(26, 43, 51, 0.45)',
  shadow: 'rgba(26, 43, 51, 0.08)',
} as const;

export type ColorToken = keyof typeof colors;
