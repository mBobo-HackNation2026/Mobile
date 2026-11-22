import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatISO } from 'date-fns';
import { LocateFixed, Phone, Search } from 'lucide-react-native';

import { OsmMapPreview } from '@/components/map/OsmMapPreview';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import {
  DEMO_RADIUS_KM,
  listDemoFacilities,
  type MapOrigin,
} from '@/services/mock/facilitiesDemo';
import {
  catalogToArea,
  searchAreas,
  type GeocodedArea,
} from '@/services/location/geocodeArea';
import { getDeviceLocation } from '@/services/location/getDeviceLocation';
import { PLACE_CATALOG } from '@/services/location/placeCatalog';
import { useFacilitiesStore } from '@/store/useFacilitiesStore';
import { colors, radii, spacing, typography } from '@/theme';
import {
  FACILITY_TYPE_LABEL,
  type Facility,
  type FacilityType,
} from '@/types/facilities';

const FILTERS: { id: FacilityType | 'all'; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'hospital', label: 'Szpitale' },
  { id: 'birth_school', label: 'Szkoły rodzenia' },
  { id: 'midwife', label: 'Położne' },
  { id: 'clinic', label: 'Przychodnie' },
  { id: 'nursery', label: 'Żłobki' },
];

const QUICK_AREAS = [
  'Puławy',
  'Nowy Targ',
  'Parczew',
  'Otwock',
  'Suwałki',
  'Kłodzko',
].map((label) => {
  const hit = PLACE_CATALOG.find((p) => p.label === label)!;
  return catalogToArea(hit);
});

const DEFAULT_ORIGIN: MapOrigin = {
  lat: 52.2297,
  lng: 21.0122,
  label: 'Warszawa (domyślnie — ustaw swoją okolicę)',
};

export function MapDemoScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType =
    FILTERS.some((f) => f.id === params.type) && params.type
      ? (params.type as FacilityType | 'all')
      : 'all';
  const [filter, setFilter] = useState<FacilityType | 'all'>(initialType);
  const [radiusKm, setRadiusKm] = useState<(typeof DEMO_RADIUS_KM)[number]>(50);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodedArea[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const favorites = useFacilitiesStore((s) => s.favorites);
  const pinnedEvents = useFacilitiesStore((s) => s.pinnedEvents);
  const mapOrigin = useFacilitiesStore((s) => s.mapOrigin);
  const setMapOrigin = useFacilitiesStore((s) => s.setMapOrigin);
  const addFavorite = useFacilitiesStore((s) => s.addFavorite);
  const removeFavorite = useFacilitiesStore((s) => s.removeFavorite);
  const pinEvent = useFacilitiesStore((s) => s.pinEvent);
  const unpinEvent = useFacilitiesStore((s) => s.unpinEvent);

  const origin: MapOrigin = mapOrigin ?? DEFAULT_ORIGIN;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      void searchAreas(q)
        .then((results) => {
          if (!cancelled) setSuggestions(results);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const search = useMemo(
    () => listDemoFacilities({ type: filter, origin, radiusKm }),
    [filter, origin, radiusKm],
  );

  const items = search.inRadius;
  const nearestOutside = search.nearestOutside;
  const compared = items
    .concat(nearestOutside)
    .filter((f) => compareIds.includes(f.id));

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const applyArea = (area: GeocodedArea, source: 'search' | 'catalog') => {
    setMapOrigin({
      lat: area.lat,
      lng: area.lng,
      label: area.label,
      source,
    });
    setQuery(area.label);
    setSuggestions([]);
    setLocationMessage(null);
  };

  const useGps = async () => {
    setLocating(true);
    setLocationMessage(null);
    const result = await getDeviceLocation();
    setLocating(false);
    if (!result.ok) {
      setLocationMessage(result.message);
      return;
    }
    setMapOrigin({
      lat: result.lat,
      lng: result.lng,
      label: result.label,
      source: 'gps',
    });
    setQuery('');
    setSuggestions([]);
    setLocationMessage('Ustawiono lokalizację urządzenia.');
  };

  return (
    <Screen title="Mapa pomocy">
      <DemoBanner message="Placówki i dni otwarte są demonstracyjne. Nie udają aktualnych danych produkcyjnych." />

      <Text style={styles.lead}>
        Użyj lokalizacji albo wpisz dowolną okolicę — miasto, wieś, gminę albo powiat. Szukamy
        ośrodków w wybranym promieniu (także poza dużymi miastami).
      </Text>

      <Card>
        <Text style={styles.groupLabel}>Twoja okolica</Text>
        <TextField
          label="Szukaj miejsca"
          value={query}
          onChangeText={setQuery}
          placeholder="Np. Parczew, Grodzisk, nazwa wsi…"
          hint={searching ? 'Szukam w katalogu i OpenStreetMap…' : undefined}
          autoCapitalize="words"
        />

        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((area) => (
              <Pressable
                key={area.id}
                onPress={() =>
                  applyArea(area, area.source === 'catalog' ? 'catalog' : 'search')
                }
                style={styles.suggestion}
                accessibilityRole="button"
              >
                <Search size={16} color={colors.primary} />
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionTitle}>{area.label}</Text>
                  <Text style={styles.meta}>
                    {area.hint}
                    {area.source === 'nominatim' ? ' · OSM' : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.locationActions}>
          <Button
            label={locating ? 'Pobieram…' : 'Użyj mojej lokalizacji'}
            onPress={() => void useGps()}
            disabled={locating}
          />
        </View>

        <Text style={styles.quickLabel}>Szybkie okolice (w tym mniejsze)</Text>
        <View style={styles.filters}>
          {QUICK_AREAS.map((area) => (
            <Pressable
              key={area.id}
              onPress={() => applyArea(area, 'catalog')}
              style={[
                styles.filter,
                mapOrigin?.label === area.label && styles.filterActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterText,
                  mapOrigin?.label === area.label && styles.filterTextActive,
                ]}
              >
                {area.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.originBox}>
          <LocateFixed size={18} color={colors.primary} />
          <View style={styles.originCopy}>
            <Text style={styles.originLabel}>Aktualny punkt wyszukiwania</Text>
            <Text style={styles.originValue}>{origin.label}</Text>
            {mapOrigin?.source ? (
              <Text style={styles.meta}>
                Źródło:{' '}
                {mapOrigin.source === 'gps'
                  ? 'lokalizacja urządzenia'
                  : mapOrigin.source === 'catalog'
                    ? 'katalog lokalny'
                    : 'wyszukiwanie OSM'}
              </Text>
            ) : (
              <Text style={styles.meta}>Nie ustawiono — używany punkt domyślny</Text>
            )}
          </View>
        </View>

        {locationMessage ? <Text style={styles.locationMsg}>{locationMessage}</Text> : null}
      </Card>

      <Text style={styles.groupLabel}>Promień</Text>
      <View style={styles.filters}>
        {DEMO_RADIUS_KM.map((km) => (
          <Pressable
            key={km}
            onPress={() => setRadiusKm(km)}
            style={[styles.filter, radiusKm === km && styles.filterActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: radiusKm === km }}
          >
            <Text
              style={[styles.filterText, radiusKm === km && styles.filterTextActive]}
            >
              {km} km
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.groupLabel}>Kategoria</Text>
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setFilter(item.id)}
            style={[styles.filter, filter === item.id && styles.filterActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.id }}
          >
            <Text
              style={[styles.filterText, filter === item.id && styles.filterTextActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <OsmMapPreview
        lat={origin.lat}
        lng={origin.lng}
        label={`${origin.label} · do ${radiusKm} km · ${items.length} w promieniu`}
      />
      <Text style={styles.mapHint}>
        Zaznacz do 3 placówek, żeby porównać · dodaj ulubione do planu · dni otwarte do kalendarza
      </Text>

      {compared.length >= 2 ? (
        <Card>
          <Text style={styles.compareTitle}>Porównanie ({compared.length})</Text>
          {compared.map((facility) => (
            <View key={facility.id} style={styles.compareRow}>
              <Text style={styles.compareName}>{facility.name}</Text>
              <Text style={styles.meta}>
                {facility.distanceKm.toFixed(1)} km · {facility.services.join(' · ') || '—'}
              </Text>
              <Text style={styles.meta}>
                Dni otwarte:{' '}
                {facility.events.length
                  ? facility.events.map((e) => e.title).join(', ')
                  : 'brak potwierdzonej informacji'}
              </Text>
            </View>
          ))}
          <Button label="Wyczyść porównanie" variant="ghost" onPress={() => setCompareIds([])} />
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <Text style={styles.body}>
            Brak placówek DEMO w promieniu {radiusKm} km od „{origin.label}”. Powiększ promień
            albo zobacz najbliższe poniżej — baza demo jest rzadka poza dużymi miastami.
          </Text>
        </Card>
      ) : (
        items.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            selected={compareIds.includes(facility.id)}
            isFavorite={favorites.some((f) => f.id === facility.id)}
            pinnedEventIds={pinnedEvents.map((e) => e.id)}
            onToggleCompare={() => toggleCompare(facility.id)}
            onToggleFavorite={() => {
              if (favorites.some((f) => f.id === facility.id)) {
                removeFavorite(facility.id);
                return;
              }
              addFavorite({
                id: facility.id,
                name: facility.name,
                type: facility.type,
                city: facility.city,
                savedAt: formatISO(new Date()),
              });
            }}
            onToggleEvent={(event) => {
              if (pinnedEvents.some((e) => e.id === event.id)) {
                unpinEvent(event.id);
                return;
              }
              pinEvent({
                id: event.id,
                facilityId: facility.id,
                facilityName: facility.name,
                title: event.title,
                date: event.startsAt.slice(0, 10),
                startsAt: event.startsAt,
                registrationUrl: event.registrationUrl,
                pinnedAt: formatISO(new Date()),
              });
            }}
          />
        ))
      )}

      {nearestOutside.length > 0 ? (
        <View style={styles.outsideSection}>
          <Text style={styles.sectionTitle}>Najbliższe poza promieniem</Text>
          <Text style={styles.mapHint}>
            Pokazujemy najbliższe fixture DEMO, żeby osoby ze wsi / małych gmin nie dostawały
            pustej listy.
          </Text>
          {nearestOutside.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              selected={compareIds.includes(facility.id)}
              isFavorite={favorites.some((f) => f.id === facility.id)}
              pinnedEventIds={pinnedEvents.map((e) => e.id)}
              outsideRadius
              onToggleCompare={() => toggleCompare(facility.id)}
              onToggleFavorite={() => {
                if (favorites.some((f) => f.id === facility.id)) {
                  removeFavorite(facility.id);
                  return;
                }
                addFavorite({
                  id: facility.id,
                  name: facility.name,
                  type: facility.type,
                  city: facility.city,
                  savedAt: formatISO(new Date()),
                });
              }}
              onToggleEvent={(event) => {
                if (pinnedEvents.some((e) => e.id === event.id)) {
                  unpinEvent(event.id);
                  return;
                }
                pinEvent({
                  id: event.id,
                  facilityId: facility.id,
                  facilityName: facility.name,
                  title: event.title,
                  date: event.startsAt.slice(0, 10),
                  startsAt: event.startsAt,
                  registrationUrl: event.registrationUrl,
                  pinnedAt: formatISO(new Date()),
                });
              }}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function FacilityCard({
  facility,
  selected,
  isFavorite,
  pinnedEventIds,
  outsideRadius,
  onToggleCompare,
  onToggleFavorite,
  onToggleEvent,
}: {
  facility: Facility;
  selected: boolean;
  isFavorite: boolean;
  pinnedEventIds: string[];
  outsideRadius?: boolean;
  onToggleCompare: () => void;
  onToggleFavorite: () => void;
  onToggleEvent: (event: Facility['events'][number]) => void;
}) {
  return (
    <Card>
      <View style={styles.cardTop}>
        <Badge label={FACILITY_TYPE_LABEL[facility.type]} tone="primary" />
        <Badge label="DEMO" tone="demo" />
        {outsideRadius ? <Badge label="Poza promieniem" tone="warning" /> : null}
        {selected ? <Badge label="W porównaniu" tone="success" /> : null}
        {isFavorite ? <Badge label="W planie" tone="success" /> : null}
      </View>
      <Text style={styles.name}>{facility.name}</Text>
      <Text style={styles.meta}>
        {facility.address}, {facility.city} · {facility.distanceKm.toFixed(1)} km
      </Text>
      <Text style={styles.body}>{facility.notes}</Text>
      {facility.services.length ? (
        <Text style={styles.meta}>Usługi: {facility.services.join(' · ')}</Text>
      ) : null}

      {facility.events.length === 0 && facility.type === 'hospital' ? (
        <Text style={styles.warn}>
          Brak aktualnej informacji o dniach otwartych — sprawdź stronę szpitala lub zadzwoń.
        </Text>
      ) : null}

      {facility.events.map((event) => {
        const pinned = pinnedEventIds.includes(event.id);
        return (
          <View key={event.id} style={styles.event}>
            <Badge label="Wydarzenie DEMO" tone="warning" />
            {pinned ? <Badge label="W kalendarzu" tone="success" /> : null}
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.meta}>{event.startsAt}</Text>
            {event.registrationRequired ? (
              <Text style={styles.meta}>Wymagany zapis (DEMO)</Text>
            ) : null}
            <Pressable onPress={() => onToggleEvent(event)} style={styles.action}>
              <Text style={styles.actionText}>
                {pinned ? 'Usuń z kalendarza' : 'Dodaj do kalendarza'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.source}>
        Źródło: {facility.sourceLabel} · {facility.verifiedAt} · {facility.verification}
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={onToggleCompare} style={styles.action}>
          <Text style={styles.actionText}>
            {selected ? 'Usuń z porównania' : 'Dodaj do porównania'}
          </Text>
        </Pressable>
        <Pressable onPress={onToggleFavorite} style={styles.action}>
          <Text style={styles.actionText}>
            {isFavorite ? 'Usuń z planu' : 'Dodaj do planu'}
          </Text>
        </Pressable>
        {facility.phone ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${facility.phone}`)}
            style={styles.action}
          >
            <Phone size={16} color={colors.primary} />
            <Text style={styles.actionText}>Zadzwoń</Text>
          </Pressable>
        ) : null}
        {facility.website ? (
          <Pressable
            onPress={() => Linking.openURL(facility.website!)}
            style={styles.action}
          >
            <Text style={styles.actionText}>Strona / oferta →</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  lead: { ...typography.body, color: colors.textSecondary },
  groupLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  quickLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filter: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  filterActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: { ...typography.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  suggestions: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  suggestionCopy: { flex: 1, minWidth: 0, gap: 2 },
  suggestionTitle: { ...typography.bodyStrong, color: colors.text },
  locationActions: { marginTop: spacing.sm },
  originBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  originCopy: { flex: 1, minWidth: 0, gap: 2 },
  originLabel: { ...typography.caption, color: colors.textMuted },
  originValue: { ...typography.bodyStrong, color: colors.text },
  locationMsg: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  mapHint: { ...typography.small, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.text },
  outsideSection: { gap: spacing.sm, marginTop: spacing.md },
  compareTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  compareRow: {
    gap: 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compareName: { ...typography.bodyStrong, color: colors.text },
  cardTop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  body: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  warn: { ...typography.small, color: colors.warning, marginTop: spacing.sm },
  event: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
    gap: 4,
  },
  eventTitle: { ...typography.bodyStrong, color: colors.text },
  source: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { ...typography.bodyStrong, color: colors.primary },
});
