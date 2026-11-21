import type { LucideIcon } from 'lucide-react-native';
import {
  Briefcase,
  Calculator,
  Home,
  UserRound,
} from 'lucide-react-native';

export interface NavItem {
  href: '/home' | '/sprawy' | '/calculator' | '/profile';
  label: string;
  icon: LucideIcon;
}

/** Dolne menu: Start (koła) | Sprawy | Kalkulator | Profil — świadczenia z dużego koła. */
export const mainNavItems: NavItem[] = [
  { href: '/home', label: 'Start', icon: Home },
  { href: '/sprawy', label: 'Sprawy', icon: Briefcase },
  { href: '/calculator', label: 'Kalkulator', icon: Calculator },
  { href: '/profile', label: 'Profil', icon: UserRound },
];

/** Dodatkowe linki w expanded sidebar / profilu */
export const secondaryNavItems = [
  { href: '/benefits' as const, label: 'Świadczenia ZUS' },
  { href: '/other-benefits' as const, label: 'Inne świadczenia' },
  { href: '/eligibility' as const, label: 'Ocena API (macierzyński)' },
  { href: '/plan' as const, label: 'Checklista' },
  { href: '/calendar' as const, label: 'Kalendarz' },
  { href: '/documents' as const, label: 'Dokumenty' },
  { href: '/zus' as const, label: 'Dane ZUS' },
  { href: '/demo' as const, label: 'Demo' },
];
