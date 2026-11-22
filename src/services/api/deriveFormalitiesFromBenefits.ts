import type { BenefitDeadline } from '@/types/calendar';
import type { BenefitAssessment } from '@/types/benefits';
import type {
  ApplicationDocument,
  DeadlineRadarItem,
  DeadlineUrgency,
  DocumentAssistantBundle,
} from '@/types/extensions';
import type {
  ChecklistItem,
  ChecklistPriority,
  DeadlineItem,
} from '@/types/journey';

export type FormalitiesBundle = {
  checklist: ChecklistItem[];
  deadlines: BenefitDeadline[];
  deadlineRadar: DeadlineRadarItem[];
  upcomingDeadline: DeadlineItem | null;
  documentAssistant: DocumentAssistantBundle;
};

/**
 * Buduje checklistę / terminy wyłącznie z ocen świadczeń FastAPI
 * (procedure, braki danych) — bez lokalnego generatora planu i bez zgadywania prawa.
 */
export function deriveFormalitiesFromBenefits(
  benefits: BenefitAssessment[],
): FormalitiesBundle {
  const checklist: ChecklistItem[] = [];
  const deadlines: BenefitDeadline[] = [];
  const deadlineRadar: DeadlineRadarItem[] = [];
  const applications: DocumentAssistantBundle['applications'] = [];

  for (const benefit of benefits) {
    if (benefit.planMissing || !benefit.procedure) {
      if (benefit.status === 'insufficient_data') {
        checklist.push({
          id: `api-missing-${benefit.id}`,
          title: `Uzupełnij dane: ${benefit.title}`,
          description: `[FastAPI] ${benefit.summary} Źródło: eligibility/check — nie lokalny plan DEMO.`,
          status: 'todo',
          dueDate: null,
          documents: [],
          office: null,
          officialUrl: 'https://www.zus.pl',
          ctaLabel: 'Uzupełnij ankietę',
          ctaHref: '/onboarding',
          priority: 'needs_verification',
        });
      }
      continue;
    }

    const procedure = benefit.procedure;
    const priority = priorityForBenefit(benefit);
    const isoDue = extractIsoDate(procedure.submitBy);

    checklist.push({
      id: `api-proc-${benefit.id}`,
      title: `Wniosek / formalności: ${benefit.title}`,
      description: [
        '[FastAPI]',
        procedure.formCode ? `Formularz: ${procedure.formCode}.` : null,
        procedure.submitBy && !isoDue
          ? `Termin (opis API): ${procedure.submitBy}.`
          : null,
        'To nie jest decyzja ZUS — wynik silnika na podstawie Twoich danych.',
      ]
        .filter(Boolean)
        .join(' '),
      status: 'todo',
      dueDate: isoDue,
      documents: procedure.documents,
      office: procedure.office,
      officialUrl: 'https://www.zus.pl',
      ctaLabel: benefit.nextStepLabel,
      ctaHref: benefit.nextStepHref,
      priority,
    });

    if (isoDue) {
      const deadlineId = `api-deadline-${benefit.id}`;
      deadlines.push({
        id: deadlineId,
        title: benefit.title,
        submitBy: isoDue,
        windowStart: null,
        kind: 'benefit_submission',
        benefitId: benefit.id,
        description: procedure.submitBy ?? 'Termin z planu FastAPI',
        office: procedure.office,
        officialUrl: 'https://www.zus.pl',
        relatedChecklistId: `api-proc-${benefit.id}`,
        isDemo: true,
      });
      deadlineRadar.push({
        id: `api-radar-${benefit.id}`,
        title: benefit.title,
        submitBy: isoDue,
        urgency: urgencyFromIso(isoDue),
        warning: null,
        actionLabel: 'Zobacz szczegóły świadczenia',
        actionHref: `/benefits/${benefit.id}`,
        benefitId: benefit.id,
        office: procedure.office,
        isDemo: false,
      });
    } else if (procedure.submitBy) {
      deadlineRadar.push({
        id: `api-radar-text-${benefit.id}`,
        title: benefit.title,
        submitBy: procedure.submitBy,
        urgency: 'planned',
        warning:
          'Termin z API jest opisowy (bez daty ISO) — nie ustawiamy daty w kalendarzu lokalnie.',
        actionLabel: 'Zobacz formalności',
        actionHref: `/benefits/${benefit.id}`,
        benefitId: benefit.id,
        office: procedure.office,
        isDemo: false,
      });
    }

    if (procedure.documents.length || procedure.formCode) {
      const docs: ApplicationDocument[] = procedure.documents.map((title, index) => ({
        id: `api-doc-${benefit.id}-${index}`,
        title,
        formCode: index === 0 ? procedure.formCode : null,
        required: true,
        status: 'missing' as const,
        purpose: `Wymagane przez plan FastAPI dla ${benefit.title}`,
        linkedApplicationId: benefit.id,
        linkedApplicationTitle: benefit.title,
        officialUrl: 'https://www.zus.pl',
        isDemo: false,
      }));
      applications.push({
        id: `api-app-${benefit.id}`,
        title: benefit.title,
        formCode: procedure.formCode,
        benefitId: benefit.id,
        documents: docs,
      });
    }
  }

  const upcomingDeadline = pickUpcoming(deadlines);

  return {
    checklist,
    deadlines,
    deadlineRadar,
    upcomingDeadline,
    documentAssistant: {
      applications,
      retiredNote:
        'Od 24.10.2026 formularze ZUR/ZAO łączą się z ZAM; Z-3b wycofano — weryfikuj aktualny wzór na zus.pl.',
      isDemo: false,
    },
  };
}

function priorityForBenefit(benefit: BenefitAssessment): ChecklistPriority {
  if (benefit.status === 'likely_eligible') return 'required';
  if (benefit.status === 'insufficient_data') return 'needs_verification';
  if (benefit.status === 'obstacle_with_options') return 'needs_verification';
  if (benefit.status === 'needs_review') return 'needs_verification';
  return 'optional';
}

/** Akceptuje YYYY-MM-DD na początku stringa. */
export function extractIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

export function isIsoDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value.trim());
}

function urgencyFromIso(iso: string): DeadlineUrgency {
  const due = Date.parse(iso);
  if (Number.isNaN(due)) return 'planned';
  const days = Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'overdue';
  if (days <= 7) return 'urgent';
  if (days <= 21) return 'soon';
  return 'planned';
}

function pickUpcoming(deadlines: BenefitDeadline[]): DeadlineItem | null {
  const future = [...deadlines]
    .filter((d) => isIsoDateString(d.submitBy))
    .sort((a, b) => a.submitBy.localeCompare(b.submitBy));
  const next = future[0];
  if (!next) return null;
  return {
    id: next.id,
    title: next.title,
    date: next.submitBy,
    relatedChecklistId: next.relatedChecklistId,
  };
}
