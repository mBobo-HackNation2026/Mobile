import type { LucideIcon } from 'lucide-react-native';
import {
  Calculator,
  CalendarDays,
  FileCheck,
  ListChecks,
  UserRound,
} from 'lucide-react-native';

export interface NavItem {
  href: '/home' | '/sprawy' | '/benefits' | '/calculator' | '/profile';
  label: string;
  icon: LucideIcon;
}

/**
 * Etap 14 — Plan · Sprawy · Świadczenia (domyślne) · Kalkulator · Profil
 * Kalendarz / mapa / demo pozostają w menu skrótów.
 */
export const mainNavItems: NavItem[] = [
  { href: '/home', label: 'Plan', icon: CalendarDays },
  { href: '/sprawy', label: 'Sprawy', icon: ListChecks },
  { href: '/benefits', label: 'Świadczenia', icon: FileCheck },
  { href: '/calculator', label: 'Kalkulator', icon: Calculator },
  { href: '/profile', label: 'Profil', icon: UserRound },
];

/** Dodatkowe linki w expanded sidebar / menu skrótów */
export const secondaryNavItems = [
  { href: '/home-menu' as const, label: 'Menu skrótów' },
  { href: '/sample-cases' as const, label: 'Przykładowe sprawy' },
  { href: '/help' as const, label: 'Gdzie szukać pomocy' },
  { href: '/calendar' as const, label: 'Kalendarz' },
  { href: '/map' as const, label: 'Mapa placówek' },
  { href: '/plan' as const, label: 'Checklista (filtry)' },
  { href: '/documents' as const, label: 'Dokumenty' },
  { href: '/zus' as const, label: 'Dane ZUS (symulacja)' },
  { href: '/demo' as const, label: 'Przykładowe sprawy' },
  { href: '/other-benefits' as const, label: 'Inne świadczenia' },
  { href: '/eligibility' as const, label: 'Ocena API (macierzyński)' },
];
