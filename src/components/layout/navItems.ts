import type { LucideIcon } from 'lucide-react-native';
import {
  CalendarDays,
  ClipboardList,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

export interface NavItem {
  href: '/home' | '/calendar' | '/benefits' | '/map' | '/profile';
  label: string;
  icon: LucideIcon;
}

/** Brief: Plan | Kalendarz | Świadczenia | Mapa | Profil */
export const mainNavItems: NavItem[] = [
  { href: '/home', label: 'Plan', icon: ClipboardList },
  { href: '/calendar', label: 'Kalendarz', icon: CalendarDays },
  { href: '/benefits', label: 'Świadczenia', icon: ShieldCheck },
  { href: '/map', label: 'Mapa', icon: MapPinned },
  { href: '/profile', label: 'Profil', icon: UserRound },
];

/** Dodatkowe linki w expanded sidebar / profilu */
export const secondaryNavItems = [
  { href: '/home-menu' as const, label: 'Menu skrótów' },
  { href: '/sprawy' as const, label: 'Moje sprawy' },
  { href: '/other-benefits' as const, label: 'Inne świadczenia' },
  { href: '/eligibility' as const, label: 'Ocena API (macierzyński)' },
  { href: '/plan' as const, label: 'Checklista (stara)' },
  { href: '/calculator' as const, label: 'Kalkulator' },
  { href: '/documents' as const, label: 'Dokumenty' },
  { href: '/zus' as const, label: 'Dane ZUS' },
  { href: '/demo' as const, label: 'Demo' },
];
