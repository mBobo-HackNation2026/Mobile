import type { ParentProfile } from '@/types/journey';

/** Mapuje lokalny profil do payloadu FastAPI. */
export function toProfileRequest(profile: ParentProfile) {
  return {
    stage: profile.stage,
    role: profile.role,
    eventDate: profile.eventDate,
    employmentType: profile.employmentType,
    insuranceStatus: profile.insuranceStatus,
    hasSecondParent: profile.hasSecondParent,
    childrenCount: profile.childrenCount,
    specialCircumstances: profile.specialCircumstances ?? [],
  };
}
