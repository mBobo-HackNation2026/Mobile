import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  CHARITY_ORGANIZATIONS,
  USC_ODPIS_LINK,
  type CharityAudience,
  type CharityOrganization,
} from '@/features/support/charityCatalog';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { colors, radii, spacing, typography } from '@/theme';

const AUDIENCE_FILTERS: { id: CharityAudience | 'all'; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'bereavement', label: 'Po stracie' },
  { id: 'miscarriage', label: 'Poronienie' },
  { id: 'prematurity', label: 'Wcześniaki' },
  { id: 'serious_illness', label: 'Ciężka choroba' },
];

export function HelpSupportScreen() {
  return (
    <Screen
      title="Gdzie szukać pomocy"
      subtitle="Zweryfikowane organizacje charytatywne i oficjalne usługi."
      backFallbackHref="/benefits"
    >
      <Card style={styles.calm}>
        <Text style={styles.lead}>
          Jeśli jesteś w trudnej sytuacji, nie musisz przechodzić tego sama / sam.
          Poniżej są organizacje o charakterze pomocowym oraz oficjalna usługa
          uzyskania odpisu aktu. eBobo nie zastępuje wsparcia specjalistycznego.
        </Text>
      </Card>

      <Text style={styles.section}>Organizacje charytatywne</Text>
      <Text style={styles.meta}>
        Lista krótka i jakościowa. Linki prowadzą do oficjalnych stron — bez
        wymyślonych numerów telefonów w aplikacji. Zweryfikowano: 2026-11-22.
      </Text>

      {CHARITY_ORGANIZATIONS.map((org) => (
        <CharityCard key={org.id} org={org} />
      ))}

      <Text style={styles.section}>Akt stanu cywilnego</Text>
      <Card>
        <Text style={styles.title}>{USC_ODPIS_LINK.title}</Text>
        <Text style={styles.body}>{USC_ODPIS_LINK.description}</Text>
        <Badge label="gov.pl" tone="neutral" />
        <Button
          label="Otwórz usługę gov.pl"
          onPress={() => void openExternalUrl(USC_ODPIS_LINK.url)}
          fullWidth
        />
      </Card>

      <Text style={styles.footerNote}>
        Filtry kontekstowe: {AUDIENCE_FILTERS.map((f) => f.label).join(' · ')}.
        Sekcja nie jest reklamą — pojawia się przy szczególnych sytuacjach i w
        menu skrótów.
      </Text>
    </Screen>
  );
}

function CharityCard({ org }: { org: CharityOrganization }) {
  return (
    <Card style={styles.calm}>
      <Text style={styles.title}>{org.name}</Text>
      <Text style={styles.body}>{org.helpScope}</Text>
      <Text style={styles.meta}>Dla kogo: {org.forWhom}</Text>
      <Text style={styles.meta}>{org.natureNote}</Text>
      <View style={styles.tags}>
        {org.audiences.map((a) => (
          <Badge key={a} label={audienceLabel(a)} tone="neutral" />
        ))}
      </View>
      <Button
        label="Otwórz stronę organizacji"
        variant="secondary"
        onPress={() => void openExternalUrl(org.url)}
        fullWidth
      />
    </Card>
  );
}

function audienceLabel(a: CharityAudience): string {
  switch (a) {
    case 'bereavement':
      return 'Po stracie';
    case 'prematurity':
      return 'Wcześniaki';
    case 'serious_illness':
      return 'Ciężka choroba';
    case 'miscarriage':
      return 'Poronienie';
  }
}

const styles = StyleSheet.create({
  calm: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  lead: { ...typography.body, color: colors.textSecondary },
  section: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  title: { ...typography.h3, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
  meta: { ...typography.small, color: colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  footerNote: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.lg,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
});
