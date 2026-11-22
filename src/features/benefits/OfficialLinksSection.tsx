import { ExternalLink } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  EZUS_ENTRY,
  groupLinksByKind,
  linksForBenefit,
  resolvePaymentChannel,
  type OfficialLink,
  type PaymentChannelGuidance,
} from '@/features/benefits/officialLinks';
import { describeOpenFailure, openExternalUrl } from '@/lib/openExternalUrl';
import type { BenefitCode } from '@/services/api';
import { colors, radii, spacing, typography } from '@/theme';
import type { ParentProfile } from '@/types/journey';

export function OfficialLinksSection({
  benefitCode,
  profile,
  officeText,
  calm = false,
}: {
  benefitCode: BenefitCode;
  profile: Pick<ParentProfile, 'employmentType'>;
  officeText?: string | null;
  /** Spokojniejszy układ (np. martwe urodzenie). */
  calm?: boolean;
}) {
  const channel = resolvePaymentChannel(profile, officeText);
  const links = linksForBenefit(benefitCode, channel.channel);
  const groups = groupLinksByKind(links);
  const [error, setError] = useState<string | null>(null);

  const onOpen = async (link: OfficialLink) => {
    setError(null);
    const result = await openExternalUrl(link.url);
    if (!result.ok) setError(describeOpenFailure(result.reason));
  };

  return (
    <Card style={calm ? styles.calmCard : undefined}>
      <Text style={styles.section}>Gdzie załatwisz sprawę?</Text>
      <Text style={styles.body}>
        Oficjalne strony instytucji. Otwarcie linku nie pobiera statusu sprawy do eBobo
        i nie składa wniosku.
      </Text>

      <PaymentChannelCard guidance={channel} />

      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.items.map((link) => (
            <OfficialLinkRow key={link.id} link={link} onOpen={onOpen} />
          ))}
        </View>
      ))}

      {(channel.channel === 'zus' ||
        channel.channel === 'zus_or_employer' ||
        channel.channel === 'unknown') &&
      !links.some((l) => l.id === EZUS_ENTRY.id) ? (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Portal spraw ZUS</Text>
          <OfficialLinkRow link={EZUS_ENTRY} onOpen={onOpen} />
        </View>
      ) : null}

      {channel.channel === 'employer' ||
      channel.channel === 'zus_or_employer' ||
      channel.channel === 'unknown' ? (
        <View style={styles.employerBox}>
          <Badge label="Pracodawca" tone="neutral" />
          <Text style={styles.meta}>
            Jeśli zasiłek wypłaca pracodawca, złóż dokumenty w swojej firmie (HR /
            księgowość). eBobo nie łączy się z systemem pracodawcy.
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Card>
  );
}

function PaymentChannelCard({ guidance }: { guidance: PaymentChannelGuidance }) {
  return (
    <View style={styles.channelBox}>
      <Badge label={guidance.title} tone="primary" />
      <Text style={styles.meta}>{guidance.explanation}</Text>
    </View>
  );
}

function OfficialLinkRow({
  link,
  onOpen,
}: {
  link: OfficialLink;
  onOpen: (link: OfficialLink) => void;
}) {
  return (
    <Pressable
      onPress={() => onOpen(link)}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
      accessibilityRole="link"
      accessibilityLabel={`${link.ctaLabel}: ${link.title}`}
      accessibilityHint={
        link.requiresLogin ? 'Wymaga logowania na stronie zewnętrznej' : undefined
      }
    >
      <View style={styles.linkText}>
        <Text style={styles.linkTitle}>{link.title}</Text>
        <Text style={styles.meta} numberOfLines={3}>
          {link.description}
        </Text>
        <View style={styles.linkMetaRow}>
          <Text style={styles.cta}>{link.ctaLabel}</Text>
          {link.requiresLogin ? (
            <Badge label="Logowanie" tone="neutral" />
          ) : null}
          {link.verification === 'needs_recheck' ? (
            <Badge label="Sprawdź aktualność" tone="warning" />
          ) : null}
        </View>
      </View>
      <ExternalLink size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.small, color: colors.textMuted },
  group: { gap: spacing.xs, marginTop: spacing.md },
  groupTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    minHeight: 44,
  },
  linkPressed: { opacity: 0.85 },
  linkText: { flex: 1, gap: 4 },
  linkTitle: { ...typography.bodyStrong, color: colors.text },
  linkMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  cta: { ...typography.bodyStrong, color: colors.primary },
  channelBox: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    marginBottom: spacing.sm,
  },
  employerBox: {
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calmCard: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
});
