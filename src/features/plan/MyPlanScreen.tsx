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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { buildParentPlan } from '@/features/plan/buildParentPlan';
import {
  PLAN_BUCKET_LABEL,
  PLAN_BUCKET_ORDER,
  PLAN_CATEGORY_COLORS,
  PLAN_CATEGORY_LABEL,
  PLAN_KIND_LABEL,
} from '@/features/plan/planUi';
import { formatShortDatePl } from '@/lib/format';
import { FACILITY_TYPE_LABEL } from '@/types/facilities';
import { useFacilitiesStore } from '@/store/useFacilitiesStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, radii, spacing, typography } from '@/theme';
import type { ChecklistStatus } from '@/types/journey';
import type { PlanTask, PlanTaskCategory } from '@/types/plan';

const CATEGORY_ICON: Record<
  PlanTaskCategory,
  typeof Landmark
> = {
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

  const grouped = PLAN_BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: plan.tasks.filter((t) => t.bucket === bucket),
  })).filter((g) => g.items.length > 0);

  const progress =
    plan.tasks.length === 0 ? 0 : plan.doneCount / plan.tasks.length;

  return (
    <Screen title="Mój plan">
      <ApiHealthBanner />
      <DemoBanner message="To lokalny plan DEMO (oś czasu). Ocena prawna i wnioski z FastAPI są w Świadczeniach; formalności API+DEMO także w Moich sprawach." />

      <Card>
        <Text style={styles.stage}>{plan.timeline.stageLabel}</Text>
        {plan.timeline.progressLabel ? (
          <Text style={styles.progressLabel}>{plan.timeline.progressLabel}</Text>
        ) : null}
        {plan.nextDeadline ? (
          <Text style={styles.nextDeadline}>
            Najbliższy termin: {plan.nextDeadline.title} ·{' '}
            {formatShortDatePl(plan.nextDeadline.date)}
          </Text>
        ) : (
          <Text style={styles.nextDeadline}>Brak sztywnego terminu w otwartych zadaniach.</Text>
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressMeta}>
          Zrobione {plan.doneCount} z {plan.tasks.length} · otwarte {plan.openCount}
        </Text>
        <View style={styles.quickLinks}>
          <Link href="/benefits">
            <Text style={styles.quickLink}>Świadczenia →</Text>
          </Link>
          <Link href="/calendar">
            <Text style={styles.quickLink}>Kalendarz →</Text>
          </Link>
          <Link href="/map">
            <Text style={styles.quickLink}>Mapa →</Text>
          </Link>
        </View>
      </Card>

      {grouped.map(({ bucket, items }) => (
        <View key={bucket} style={styles.section}>
          <Text style={styles.sectionTitle}>{PLAN_BUCKET_LABEL[bucket]}</Text>
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

      {favorites.length > 0 || pinnedEvents.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zapisane z mapy</Text>
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
        </View>
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
            value={task.onlinePossible ? 'Możliwe online / częściowo' : 'Raczej stacjonarnie'}
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
  stage: { ...typography.h2, color: colors.text },
  progressLabel: { ...typography.bodyStrong, color: colors.primaryHover, marginTop: spacing.xs },
  nextDeadline: { ...typography.small, color: colors.textSecondary, marginTop: spacing.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickLink: { ...typography.bodyStrong, color: colors.primary },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text },
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
  cardTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
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
  favActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
