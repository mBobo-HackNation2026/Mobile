import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';
import { INSTITUTIONS, type InstitutionId } from '@/types/institutions';

interface InstitutionMarkProps {
  institutionId: InstitutionId;
  /** Domyślnie tylko monogram; `withLabel` pokazuje też nazwę. */
  withLabel?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Monogram instytucji w rogu karty świadczenia.
 * Celowo nie używamy oficjalnych logo (znaki towarowe) — czytelny skrót + a11y.
 */
export function InstitutionMark({
  institutionId,
  withLabel = false,
  size = 'sm',
}: InstitutionMarkProps) {
  const meta = INSTITUTIONS[institutionId];
  const tone = toneFor(institutionId);
  const markSize = size === 'md' ? styles.markMd : styles.markSm;
  const markText = size === 'md' ? styles.markTextMd : styles.markTextSm;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Instytucja: ${meta.fullLabel}`}
    >
      <View style={[styles.mark, markSize, { backgroundColor: tone.bg }]}>
        <Text style={[markText, { color: tone.fg }]}>{meta.mark}</Text>
      </View>
      {withLabel ? <Text style={[styles.label, { color: tone.fg }]}>{meta.label}</Text> : null}
    </View>
  );
}

function toneFor(id: InstitutionId): { bg: string; fg: string } {
  switch (id) {
    case 'zus':
      return { bg: colors.primarySoft, fg: colors.primary };
    case 'employer':
      return { bg: colors.surfaceMuted, fg: colors.textSecondary };
    case 'municipality':
      return { bg: colors.infoSoft, fg: colors.info };
    case 'zus_or_employer':
      return { bg: colors.accentSoft, fg: colors.accent };
    case 'gov':
      return { bg: colors.infoSoft, fg: colors.info };
    default:
      return { bg: colors.surfaceMuted, fg: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
    maxWidth: 120,
    flexShrink: 0,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markSm: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: spacing.xs,
  },
  markMd: {
    minWidth: 48,
    height: 34,
    paddingHorizontal: spacing.sm,
  },
  markTextSm: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  markTextMd: {
    ...typography.small,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  label: {
    ...typography.caption,
    textAlign: 'right',
  },
});
