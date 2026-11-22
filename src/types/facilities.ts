export type FacilityType =
  | 'hospital'
  | 'birth_school'
  | 'midwife'
  | 'clinic'
  | 'nursery';

export type FacilityVerification = 'verified' | 'unconfirmed' | 'outdated' | 'missing';

export interface FacilityEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  registrationRequired: boolean;
  registrationUrl: string | null;
  sourceUrl: string;
  verifiedAt: string;
  verification: FacilityVerification;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  distanceKm: number;
  services: string[];
  notes: string;
  isDemo: boolean;
  sourceLabel: string;
  sourceUrl: string | null;
  verifiedAt: string;
  verification: FacilityVerification;
  events: FacilityEvent[];
}

export const FACILITY_TYPE_LABEL: Record<FacilityType, string> = {
  hospital: 'Szpital położniczy',
  birth_school: 'Szkoła rodzenia',
  midwife: 'Położna POZ',
  clinic: 'Przychodnia / POZ',
  nursery: 'Żłobek / klub',
};
