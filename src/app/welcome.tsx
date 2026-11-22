import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import type { ParentStage } from '@/types/journey';

const START_OPTIONS: { stage: ParentStage; label: string; hint: string }[] = [
  {
    stage: 'planning',
    label: 'Planuję dziecko',
    hint: 'Chcę wiedzieć, co mnie czeka zanim pojawi się termin.',
  },
  {
    stage: 'pregnancy',
    label: 'Jestem w ciąży',
    hint: 'Urlopy, zasiłki, dokumenty i terminy dla pracodawcy / ZUS.',
  },
  {
    stage: 'after_birth',
    label: 'Dziecko już się urodziło',
    hint: 'Szybka lista tego, co zrobić teraz — bez długich poradników.',
  },
  {
    stage: 'adoption',
    label: 'Adopcja',
    hint: 'Przyjęcie dziecka — dokumenty i urlopy dla opiekunów.',
  },
  {
    stage: 'foster',
    label: 'Rodzina zastępcza',
    hint: 'Niezawodowa rodzina zastępcza — ścieżka świadczeń i formalności.',
  },
];

/** Start po wejściu jako gość — wybór sytuacji i ankieta. */
export default function WelcomeScreen() {
  const { isCompact, isExpanded } = useAdaptiveLayout();
  const onboardingCompleted = useUserJourneyStore((s) => s.profile.onboardingCompleted);
  const setProfile = useUserJourneyStore((s) => s.setProfile);
  const entryMode = useAuthStore((s) => s.entryMode);
  const authStatus = useAuthStore((s) => s.status);
  const [stage, setStage] = useState<ParentStage | null>(null);

  const startSurvey = () => {
    if (stage) {
      setProfile({ stage });
    }
    router.push({
      pathname: '/onboarding',
      params: stage ? { stage } : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.root}>
          <View style={[styles.atmosphere, isExpanded && styles.atmosphereWide]} />

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.content, isExpanded && styles.contentWide]}>
              <View style={styles.brandBlock}>
                <Badge
                  label={
                    authStatus === 'authenticated' || entryMode === 'mobywatel'
                      ? 'mObywatel DEMO · Start'
                      : 'Gość · Start'
                  }
                  tone="demo"
                />
                <Text style={styles.brand}>eBobo</Text>
                <Text style={styles.headline}>
                  Sprawdź, jakie świadczenia Ci przysługują i jak je uzyskać
                </Text>
                <Text style={styles.lead}>
                  Pomagamy w formalnościach wokół ciąży i rodzicielstwa — bez trackerów
                  rozwoju dziecka i bez udawania oficjalnej decyzji ZUS.
                </Text>
              </View>

              <View style={styles.stageBlock}>
                <Text style={styles.stageTitle}>Wybierz swoją sytuację</Text>
                <Text style={styles.stageLead}>
                  Dalej: krótka ankieta, potem Twoje świadczenia i kolejne kroki.
                </Text>
                <View style={[styles.stageGrid, !isCompact && styles.stageGridWide]}>
                  {START_OPTIONS.map((option) => (
                    <View
                      key={option.stage}
                      style={!isCompact ? styles.stageItem : undefined}
                    >
                      <ChoiceChip
                        label={option.label}
                        description={option.hint}
                        selected={stage === option.stage}
                        onPress={() => setStage(option.stage)}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.actions, isCompact && styles.actionsStack]}>
                <Button
                  label="Sprawdź swoje uprawnienia"
                  onPress={startSurvey}
                  fullWidth={isCompact}
                />
                {onboardingCompleted ? (
                  <Button
                    label="Przejdź do świadczeń"
                    variant="secondary"
                    onPress={() => router.push('/benefits')}
                    fullWidth={isCompact}
                  />
                ) : (
                  <Button
                    label="Przykładowy profil ZUS (demo)"
                    variant="secondary"
                    onPress={() => router.push('/demo')}
                    fullWidth={isCompact}
                  />
                )}
              </View>

              <View style={styles.footerLinks}>
                <Link href="/">
                  <Text style={styles.footerLink}>← Wróć do logowania</Text>
                </Link>
                <Text style={styles.footerNote}>
                  eBobo pomaga ustalić: co Ci przysługuje, ile, kiedy i gdzie to załatwić.
                  Dane demo są zawsze oznaczone.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  atmosphere: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: colors.primarySoft,
    opacity: 0.85,
  },
  atmosphereWide: {
    width: 520,
    height: 520,
    right: -40,
    top: -120,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  contentWide: {
    maxWidth: 880,
  },
  brandBlock: {
    gap: spacing.md,
  },
  brand: {
    ...typography.display,
    color: colors.primaryHover,
  },
  headline: {
    ...typography.h1,
    color: colors.text,
    maxWidth: 640,
  },
  lead: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 560,
  },
  stageBlock: {
    gap: spacing.sm,
  },
  stageTitle: {
    ...typography.h3,
    color: colors.text,
  },
  stageLead: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  stageGrid: {
    gap: spacing.sm,
  },
  stageGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stageItem: {
    width: '48%',
    minWidth: 240,
    flexGrow: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionsStack: {
    flexDirection: 'column',
  },
  footerLinks: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 560,
  },
  footerLink: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  footerNote: {
    ...typography.small,
    color: colors.textMuted,
  },
});
