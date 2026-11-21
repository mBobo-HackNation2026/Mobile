import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { DEMO_SCENARIO_META } from '@/services/mock/fixtures';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

export default function DemoScreen() {
  const loadDemoScenario = useUserJourneyStore((s) => s.loadDemoScenario);
  const activeId = useUserJourneyStore((s) => s.profile.demoScenarioId);

  return (
    <Screen>
      <DemoBanner message="Profile demo ładują mockowy hub. Ocena macierzyńskiego z FastAPI jest na ekranie «Ocena API»." />
      <View style={styles.header}>
        <Text style={styles.title}>Tryb demo</Text>
        <Text style={styles.subtitle}>
          Wczytaj gotowy profil do hubu świadczeń albo uruchom 5 scenariuszy FastAPI.
        </Text>
        {activeId ? <Badge label={`Aktywny: ${activeId}`} tone="primary" /> : null}
        <Button
          label="5 scenariuszy → FastAPI (eligibility/check)"
          onPress={() => router.push('/eligibility')}
        />
      </View>

      <View style={styles.list}>
        {DEMO_SCENARIO_META.map((scenario) => {
          const isActive = activeId === scenario.id;
          return (
            <Card key={scenario.id}>
              <Badge label={isActive ? 'Wczytany' : 'Demo'} tone={isActive ? 'success' : 'demo'} />
              <Text style={styles.cardTitle}>{scenario.title}</Text>
              <Text style={styles.body}>{scenario.description}</Text>
              <Button
                label={isActive ? 'Otwórz świadczenia' : 'Wczytaj i otwórz świadczenia'}
                onPress={() => {
                  if (!isActive) {
                    loadDemoScenario(scenario.id);
                  }
                  router.navigate('/benefits');
                }}
              />
              <Link href="/benefits" style={styles.fallbackLink}>
                <Text style={styles.link}>Lub otwórz Moje świadczenia →</Text>
              </Link>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 680 },
  list: { gap: spacing.md },
  cardTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm },
  fallbackLink: { marginTop: spacing.sm },
  link: { ...typography.bodyStrong, color: colors.primary },
});
