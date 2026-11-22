import type { LucideIcon } from 'lucide-react-native';
import {
  Briefcase,
  Calculator,
  ClipboardList,
  FileText,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react-native';

import { colors } from '@/theme';

export type HomeCircleSize = 'hero' | 'sat';

export interface HomeMenuItem {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  size: HomeCircleSize;
  fill: string;
  ink: string;
  hero?: boolean;
}

/** Tylko świadczenia (hero) są większe — reszta jednakowa. */
export const HOME_MENU_ITEMS: HomeMenuItem[] = [
  {
    id: 'benefits',
    label: 'Świadczenia',
    hint: 'Co Ci przysługuje',
    href: '/benefits',
    icon: ShieldCheck,
    size: 'hero',
    fill: colors.zus,
    ink: colors.textInverse,
    hero: true,
  },
  {
    id: 'sprawy',
    label: 'Sprawy',
    hint: 'Terminy',
    href: '/sprawy',
    icon: Briefcase,
    size: 'sat',
    fill: colors.primarySoft,
    ink: colors.primaryHover,
  },
  {
    id: 'calculator',
    label: 'Kalkulator',
    hint: 'Warianty',
    href: '/calculator',
    icon: Calculator,
    size: 'sat',
    fill: colors.infoSoft,
    ink: colors.info,
  },
  {
    id: 'documents',
    label: 'Dokumenty',
    hint: 'Wnioski',
    href: '/documents',
    icon: FileText,
    size: 'sat',
    fill: colors.surfaceMuted,
    ink: colors.textSecondary,
  },
  {
    id: 'sample-cases',
    label: 'Przykłady',
    hint: 'Sprawy testowe',
    href: '/sample-cases',
    icon: ClipboardList,
    size: 'sat',
    fill: colors.warningSoft,
    ink: colors.warning,
  },
  {
    id: 'help',
    label: 'Pomoc',
    hint: 'NGO i USC',
    href: '/help',
    icon: HeartHandshake,
    size: 'sat',
    fill: colors.healthSoft,
    ink: colors.health,
  },
  {
    id: 'other',
    label: 'Poza ZUS',
    hint: '800+',
    href: '/other-benefits',
    icon: Sparkles,
    size: 'sat',
    fill: colors.demoSoft,
    ink: colors.demo,
  },
  {
    id: 'welcome',
    label: 'Ankieta',
    hint: 'Sytuacja',
    href: '/welcome',
    icon: ClipboardList,
    size: 'sat',
    fill: colors.accentSoft,
    ink: colors.accent,
  },
  {
    id: 'profile',
    label: 'Profil',
    hint: 'Konto',
    href: '/profile',
    icon: UserRound,
    size: 'sat',
    fill: colors.surfaceMuted,
    ink: colors.textSecondary,
  },
];

export const HOME_CIRCLE_SIZE: Record<HomeCircleSize, number> = {
  hero: 132,
  sat: 72,
};
