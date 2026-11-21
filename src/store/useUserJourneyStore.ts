import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { demoProfiles, emptyProfile } from '@/services/mock/fixtures';
import type { ChecklistStatus, ParentProfile } from '@/types/journey';

interface UserJourneyState {
  profile: ParentProfile;
  checklistOverrides: Record<string, ChecklistStatus>;
  setProfile: (patch: Partial<ParentProfile>) => void;
  completeOnboarding: (profile?: Partial<ParentProfile>) => void;
  loadDemoScenario: (scenarioId: string) => void;
  setChecklistStatus: (id: string, status: ChecklistStatus) => void;
  resetDemo: () => void;
}

export const useUserJourneyStore = create<UserJourneyState>()(
  persist(
    (set) => ({
      profile: emptyProfile,
      checklistOverrides: {},
      setProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch },
        })),
      completeOnboarding: (profile) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...profile,
            onboardingCompleted: true,
          },
        })),
      loadDemoScenario: (scenarioId) => {
        const demo = demoProfiles[scenarioId];
        if (!demo) return;
        set({
          profile: { ...demo },
          checklistOverrides: {},
        });
      },
      setChecklistStatus: (id, status) =>
        set((state) => ({
          checklistOverrides: {
            ...state.checklistOverrides,
            [id]: status,
          },
        })),
      resetDemo: () =>
        set({
          profile: emptyProfile,
          checklistOverrides: {},
        }),
    }),
    {
      name: 'ebobo-user-journey',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        checklistOverrides: state.checklistOverrides,
      }),
    },
  ),
);
