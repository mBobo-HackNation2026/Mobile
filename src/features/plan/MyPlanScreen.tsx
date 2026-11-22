import { Link, router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Landmark,
} from 'lucide-react-native';

import { ApiHealthBanner } from '@/components/ui/ApiHealthBanner';
import { AppSection } from '@/components/ui/AppSection';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuickActionRow } from '@/components/ui/QuickActionRow';
import { Screen } from '@/components/ui/Screen';
import { buildParentPlan } from '@/features/plan/buildParentPlan';
import {
  PLAN_BUCKET_LABEL,
  PLAN_BUCKET_ORDER,
  PLAN_CATEGORY_COLORS,
  PLAN_CATEGORY_LABEL,
  PLAN_KIND_LABEL,
} from '@/features/plan/planUi';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { formatShortDatePl } from '@/lib/format';
import { FACILITY_TYPE_LABEL } from '@/types/facilities';
import { useFacilitiesStore } from '@/store/useFacilitiesStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import type { ChecklistStatus } from '@/types/journey';
import type { PlanTask, PlanTaskCategory } from '@/types/plan';

const CATEGORY_ICON: Record<PlanTaskCategory, typeof Landmark> = {
  zus: Landmark,
  health: HeartPulse,
  admin: Building2,
  deadline: CalendarDays,
};

export function MyPlanScreen() {
  const profile = useUserJourneyStore((s) => s.profile);
  const overrides = useUserJourneyStore((s) => s.checklistOverrides);
  const setChecklistStatus = useUserJourneyStore((s) => s.setChecklistStatus);
  const favorites = useFacilitiesStore((s) => s.favorites);
  const pinnedEvents = useFacilitiesStore((s) => s.pinnedEvents);
  const removeFavorite = useFacilitiesStore((s) => s.removeFavorite);
  const unpinEvent = useFacilitiesStore((s) => s.unpinEvent);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { columns } = useAdaptiveLayout();

  const plan = useMemo(
    () => buildParentPlan(profile, overrides),
    [profile, overrides],
  );

  if (!profile.onboardingCompleted) {
    return (
      <Screen title="Mój plan">
        <EmptyState
          title="Najpierw poznajmy Twoją sytuację"
          description="Krótka ankieta wystarczy, żeby ułożyć pierwsze konkretne kroki."
          actionLabel="Zacznij ankietę"
          onAction={() => router.push('/welcome')}
        />
      </Screen>
    );
  }

  const openTasks = plan.tasks.filter((t) => t.status !== 'done');
  const focusTask =
    openTasks.find((t) => t.bucket === 'now') ??
    openTasks.find((t) => t.priority === 'required') ??
    openTasks[0] ??
    null;

  const upcoming = plan.tasks
    .filter((t) => t.status !== 'done' && (t.dueDate || t.windowLabel))
    .slice(0, 4);

  const grouped = PLAN_BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: plan.tasks.filter((t) => t.bucket === bucket),
  })).filter((g) => g.items.length > 0);

  const progress =
    plan.tasks.length === 0 ? 0 : plan.doneCount / plan.tasks.length;
  const twoCol = columns > 1;

  return (
    <Screen
      title="Mój plan"
      subtitle="Centrum formalności — lokalna oś czasu DEMO oraz szybkie przejścia do oceny i kalkulatora."
    >
      <ApiHealthBanner />
      <DemoBanner message="Lokalny plan demonstracyjny. Ocena uprawnień i kwoty są w Świadczeniach i Kalkulatorze — nie myl ich z tą osią czasu." />

      <View style={[styles.stack, twoCol && styles.stackDesktop]}>
        <View style={[styles.col, twoCol && styles.colMain]}>
          <AppSection step="A" title="Twój etap">
            <Card style={styles.heroCard}>
              <Badge label="Profil lokalny" tone="demo" />
              <Text style={styles.heroStage}>{plan.timeline.stageLabel}</Text>
              {plan.timeline.progressLabel ? (
                <Text style={styles.heroProgress}>{plan.timeline.progressLabel}</Text>
              ) : null}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressMeta}>
                Zrobione {plan.doneCount} z {plan.tasks.length} · otwarte{' '}
                {plan.openCount}
              </Text>
            </Card>
          </AppSection>

          <AppSection
            step="B"
            title="Najważniejsze teraz"
            subtitle="Najbardziej istotna otwarta czynność z planu — bez sztucznej pilności."
          >
            {focusTask ? (
              <Card style={styles.focusCard}>
                <View style={styles.focusBadges}>
                  <Badge
                    label={PLAN_CATEGORY_LABEL[focusTask.category]}
                    tone="primary"
                  />
                  <Badge label={PLAN_KIND_LABEL[focusTask.kind]} tone="neutral" />
                </View>
                <Text style={styles.focusTitle}>{focusTask.title}</Text>
                <Text style={styles.focusSummary}>{focusTask.summary}</Text>
                {focusTask.dueDate || focusTask.windowLabel ? (
                  <Text style={styles.focusDue}>
                    {focusTask.dueDate
                      ? `Termin: ${formatShortDatePl(focusTask.dueDate)}`
                      : focusTask.windowLabel}
                  </Text>
                ) : null}
                <Button
                  label={focusTask.ctaLabel}
                  onPress={() => router.push(focusTask.ctaHref as Href)}
                  fullWidth
                />
              </Card>
            ) : (
              <Card>
                <Text style={styles.emptyCopy}>
                  Brak otwartych zadań w planie. Możesz sprawdzić świadczenia albo
                  poprawić ankietę.
                </Text>
                <Button
                  label="Moje świadczenia"
                  onPress={() => router.push('/benefits')}
                />
              </Card>
            )}
          </AppSection>
        </View>

        <View style={[styles.col, twoCol && styles.colSide]}>
          <AppSection
            step="D"
            title="Nadchodzące terminy"
            subtitle="Tylko terminy z planu. Opisy bez daty nie dostają sztucznej daty."
          >
            <Card style={styles.deadlinesCard}>
              {plan.nextDeadline ? (
                <View style={styles.deadlineHighlight}>
                  <Badge label="Najbliższy" tone="warning" />
                  <Text style={styles.deadlineTitle}>{plan.nextDeadline.title}</Text>
                  <Text style={styles.deadlineDate}>
                    {formatShortDatePl(plan.nextDeadline.date)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyCopy}>
                  Brak sztywnego terminu w otwartych zadaniach.
                </Text>
              )}
              {upcoming.map((task) => (
                <View key={task.id} style={styles.deadlineRow}>
                  <Text style={styles.deadlineRowTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  <Text style={styles.deadlineRowMeta}>
                    {task.dueDate
                      ? formatShortDatePl(task.dueDate)
                      : task.windowLabel}
                  </Text>
                </View>
              ))}
              <Button
                label="Moje sprawy i radar"
                variant="secondary"
                onPress={() => router.push('/sprawy')}
              />
            </Card>
          </AppSection>

          <AppSection
            step="E"
            title="Twoje świadczenia"
            subtitle="Ocena i kwoty pochodzą z silnika — nie z tej osi DEMO."
          >
            <Card style={styles.teaserCard}>
              <Text style={styles.teaserBody}>
                Sprawdź, co prawdopodobnie Ci przysługuje, czego brakuje i jak złożyć
                wniosek. Szacunki nie są decyzją ZUS.
              </Text>
              <Button
                label="Otwórz świadczenia"
                onPress={() => router.push('/benefits')}
                fullWidth
              />
              <Button
                label="Kalkulator kwot"
                variant="secondary"
                onPress={() => router.push('/calculator')}
                fullWidth
              />
            </Card>
          </AppSection>

          <AppSection step="F" title="Szybkie działania">
            <QuickActionRow
              actions={[
                { label: 'Moje sprawy', href: '/sprawy', hint: 'Checklista' },
                { label: 'Świadczenia', href: '/benefits', hint: 'Ocena' },
                { label: 'Kalkulator', href: '/calculator', hint: 'Kwoty' },
                { label: 'Kalendarz', href: '/calendar', hint: 'Terminy' },
              ]}
            />
          </AppSection>
        </View>
      </View>

      <AppSection
        step="C"
        title="Twój plan działania"
        subtitle="Lokalna checklista DEMO — oznaczaj statusy, rozwijaj kroki."
      >
        {grouped.map(({ bucket, items }) => (
          <View key={bucket} style={styles.bucket}>
            <Text style={styles.bucketTitle}>{PLAN_BUCKET_LABEL[bucket]}</Text>
            {items.map((task) => (
              <PlanTaskCard
                key={task.id}
                task={task}
                expanded={expandedId === task.id}
                onToggle={() =>
                  setExpandedId((id) => (id === task.id ? null : task.id))
                }
                onStatus={(status) => setChecklistStatus(task.id, status)}
              />
            ))}
          </View>
        ))}
      </AppSection>

      {favorites.length > 0 || pinnedEvents.length > 0 ? (
        <AppSection title="Zapisane z mapy">
          {favorites.map((fav) => (
            <Card key={fav.id}>
              <Badge label={FACILITY_TYPE_LABEL[fav.type]} tone="primary" />
              <Text style={styles.cardTitle}>{fav.name}</Text>
              <Text style={styles.meta}>{fav.city} · DEMO</Text>
              <View style={styles.favActions}>
                <Button
                  label="Mapa"
                  variant="secondary"
                  onPress={() => router.push(`/map?type=${fav.type}`)}
                />
                <Button
                  label="Usuń"
                  variant="ghost"
                  onPress={() => removeFavorite(fav.id)}
                />
              </View>
            </Card>
          ))}
          {pinnedEvents.map((event) => (
            <Card key={event.id}>
              <Badge label="W kalendarzu" tone="success" />
              <Badge label="DEMO" tone="demo" />
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.meta}>
                {event.facilityName} · {formatShortDatePl(event.date)}
              </Text>
              <View style={styles.favActions}>
                <Button
                  label="Kalendarz"
                  variant="secondary"
                  onPress={() => router.push('/calendar')}
                />
                <Button
                  label="Usuń"
                  variant="ghost"
                  onPress={() => unpinEvent(event.id)}
                />
              </View>
            </Card>
          ))}
        </AppSection>
      ) : null}

      <Button
        label="Popraw dane w ankiecie"
        variant="secondary"
        onPress={() => router.push('/onboarding')}
      />
      <Link href="/home-menu">
        <Text style={styles.menuLink}>Pełne menu skrótów →</Text>
      </Link>
    </Screen>
  );
}

function PlanTaskCard({
  task,
  expanded,
  onToggle,
  onStatus,
}: {
  task: PlanTask;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (status: ChecklistStatus) => void;
}) {
  const colorsCat = PLAN_CATEGORY_COLORS[task.category];
  const Icon = CATEGORY_ICON[task.category];
  const isDone = task.status === 'done';

  return (
    <Card>
      <Pressable onPress={onToggle} accessibilityRole="button">
        <View style={styles.cardTop}>
          <View style={[styles.catMark, { backgroundColor: colorsCat.soft }]}>
            <Icon size={18} color={colorsCat.ink} strokeWidth={2.2} />
          </View>
          <View style={styles.cardCopy}>
            <View style={styles.badges}>
              <Badge label={PLAN_CATEGORY_LABEL[task.category]} tone="neutral" />
              <Badge label={PLAN_KIND_LABEL[task.kind]} tone="neutral" />
              {isDone ? <Badge label="Zrobione" tone="success" /> : null}
            </View>
            <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>
              {task.title}
            </Text>
            <Text style={styles.cardSummary} numberOfLines={expanded ? 6 : 2}>
              {task.summary}
            </Text>
            {task.dueDate || task.windowLabel ? (
              <Text style={styles.meta}>
                {task.dueDate
                  ? `Termin: ${formatShortDatePl(task.dueDate)}`
                  : task.windowLabel}
              </Text>
            ) : null}
          </View>
          {expanded ? (
            <ChevronUp size={18} color={colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={colors.textMuted} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          {task.institution ? (
            <Fact label="Instytucja" value={task.institution} />
          ) : null}
          <Fact
            label="Dokumenty"
            value={
              task.documents.length
                ? task.documents.join(', ')
                : 'Brak wymaganych w tym kroku'
            }
          />
          {task.steps.length ? (
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Kroki</Text>
              {task.steps.map((step, i) => (
                <Text key={step} style={styles.factValue}>
                  {i + 1}. {step}
                </Text>
              ))}
            </View>
          ) : null}
          <Fact
            label="Online"
            value={
              task.onlinePossible ? 'Możliwe online / częściowo' : 'Raczej stacjonarnie'
            }
          />
          <Fact
            label="Źródło"
            value={`${task.sourceLabel} · weryfikacja ${task.verifiedAt}`}
          />

          <View style={styles.actions}>
            <StatusChip
              label="Zrobione"
              active={task.status === 'done'}
              onPress={() => onStatus('done')}
            />
            <StatusChip
              label="Do zrobienia"
              active={task.status === 'todo'}
              onPress={() => onStatus('todo')}
            />
            <StatusChip
              label="Nie dotyczy"
              active={task.status === 'pending'}
              onPress={() => onStatus('pending')}
            />
          </View>

          <View style={styles.ctaRow}>
            <Button
              label={task.ctaLabel}
              onPress={() => router.push(task.ctaHref as Href)}
            />
            {task.mapHref ? (
              <Button
                label="Zobacz na mapie"
                variant="secondary"
                onPress={() => router.push(task.mapHref as Href)}
              />
            ) : null}
            {task.officialUrl ? (
              <Pressable onPress={() => Linking.openURL(task.officialUrl!)}>
                <Text style={styles.official}>Źródło oficjalne →</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function StatusChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active ? <Check size={14} color={colors.primary} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.xl },
  stackDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  col: { gap: spacing.xl, width: '100%' },
  colMain: { flexGrow: 1, flexBasis: 360, maxWidth: 720 },
  colSide: { flexGrow: 1, flexBasis: 300, maxWidth: 420 },
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryMuted,
    gap: spacing.xs,
  },
  heroStage: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  heroProgress: {
    ...typography.bodyStrong,
    color: colors.primaryHover,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  focusCard: { gap: spacing.sm },
  focusBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  focusTitle: { ...typography.h2, color: colors.text },
  focusSummary: { ...typography.body, color: colors.textSecondary },
  focusDue: { ...typography.small, color: colors.warning },
  deadlinesCard: { gap: spacing.sm },
  deadlineHighlight: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  deadlineTitle: { ...typography.bodyStrong, color: colors.text },
  deadlineDate: { ...typography.h3, color: colors.warning },
  deadlineRow: {
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  deadlineRowTitle: { ...typography.bodyStrong, color: colors.text },
  deadlineRowMeta: { ...typography.caption, color: colors.textMuted },
  teaserCard: { gap: spacing.sm },
  teaserBody: { ...typography.body, color: colors.textSecondary },
  emptyCopy: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  bucket: { gap: spacing.sm },
  bucketTitle: { ...typography.bodyStrong, color: colors.textMuted },
  cardTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  catMark: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1, minWidth: 0, gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardTitle: { ...typography.bodyStrong, color: colors.text, fontSize: 17 },
  cardTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  cardSummary: { ...typography.small, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.warning, marginTop: 2 },
  details: { marginTop: spacing.md, gap: spacing.sm },
  fact: { gap: 2 },
  factLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  factValue: { ...typography.body, color: colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  ctaRow: { gap: spacing.sm, marginTop: spacing.xs },
  official: { ...typography.bodyStrong, color: colors.primary },
  menuLink: {
    ...typography.bodyStrong,
    color: colors.textMuted,
    textAlign: 'center',
  },
  favActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
