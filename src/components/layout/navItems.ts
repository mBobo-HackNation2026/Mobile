import type { LucideIcon } from 'lucide-react-native';
import {
  Calculator,
  ClipboardList,
  ListChecks,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

export interface NavItem {
  href: '/home' | '/sprawy' | '/benefits' | '/calculator' | '/profile';
  label: string;
  icon: LucideIcon;
}

/**
 * Etap 9 — role modułów (brief UX):
 * Plan = co teraz · Sprawy = checklista · Świadczenia · Kalkulator · Profil
 * Kalendarz / mapa / demo pozostają w menu skrótów.
 */
export const mainNavItems: NavItem[] = [
  { href: '/home', label: 'Plan', icon: ClipboardList },
  { href: '/sprawy', label: 'Sprawy', icon: ListChecks },
  { href: '/benefits', label: 'Świadczenia', icon: ShieldCheck },
  { href: '/calculator', label: 'Kalkulator', icon: Calculator },
  { href: '/profile', label: 'Profil', icon: UserRound },
];

/** Dodatkowe linki w expanded sidebar / menu skrótów */
export const secondaryNavItems = [
  { href: '/home-menu' as const, label: 'Menu skrótów' },
  { href: '/calendar' as const, label: 'Kalendarz' },
  { href: '/map' as const, label: 'Mapa placówek' },
  { href: '/plan' as const, label: 'Checklista (filtry)' },
  { href: '/documents' as const, label: 'Dokumenty' },
  { href: '/zus' as const, label: 'Dane ZUS' },
  { href: '/demo' as const, label: 'Profile demo' },
  { href: '/other-benefits' as const, label: 'Inne świadczenia' },
  { href: '/eligibility' as const, label: 'Ocena API (macierzyński)' },
];
