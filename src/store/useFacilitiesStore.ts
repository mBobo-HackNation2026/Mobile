import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MapOrigin } from '@/services/mock/facilitiesDemo';
import type { FacilityType } from '@/types/facilities';

export interface SavedFacility {
  id: string;
  name: string;
  type: FacilityType;
  city: string;
  savedAt: string;
}

/** Dzień otwarty / wydarzenie DEMO przypięte do kalendarza użytkownika. */
export interface PinnedFacilityEvent {
  id: string;
  facilityId: string;
  facilityName: string;
  title: string;
  /** YYYY-MM-DD — dzień w kalendarzu. */
  date: string;
  startsAt: string;
  registrationUrl: string | null;
  pinnedAt: string;
}

export type MapOriginSource = 'gps' | 'search' | 'catalog';

export interface StoredMapOrigin extends MapOrigin {
  source: MapOriginSource;
}

interface FacilitiesState {
  favorites: SavedFacility[];
  pinnedEvents: PinnedFacilityEvent[];
  mapOrigin: StoredMapOrigin | null;
  setMapOrigin: (origin: StoredMapOrigin | null) => void;
  addFavorite: (facility: SavedFacility) => void;
  removeFavorite: (id: string) => void;
  pinEvent: (event: PinnedFacilityEvent) => void;
  unpinEvent: (id: string) => void;
  clearFavorites: () => void;
}

export const useFacilitiesStore = create<FacilitiesState>()(
  persist(
    (set) => ({
      favorites: [],
      pinnedEvents: [],
      mapOrigin: null,
      setMapOrigin: (origin) => set({ mapOrigin: origin }),
      addFavorite: (facility) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === facility.id)) return state;
          return { favorites: [facility, ...state.favorites].slice(0, 20) };
        }),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      pinEvent: (event) =>
        set((state) => {
          if (state.pinnedEvents.some((e) => e.id === event.id)) return state;
          return { pinnedEvents: [event, ...state.pinnedEvents].slice(0, 30) };
        }),
      unpinEvent: (id) =>
        set((state) => ({
          pinnedEvents: state.pinnedEvents.filter((e) => e.id !== id),
        })),
      clearFavorites: () =>
        set({ favorites: [], pinnedEvents: [], mapOrigin: null }),
    }),
    {
      name: 'ebobo-facilities',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        pinnedEvents: state.pinnedEvents,
        mapOrigin: state.mapOrigin,
      }),
    },
  ),
);
