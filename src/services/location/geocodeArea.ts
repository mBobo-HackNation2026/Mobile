import { filterPlaceCatalog, type PlaceSuggestion } from '@/services/location/placeCatalog';

export interface GeocodedArea {
  id: string;
  label: string;
  hint: string;
  lat: number;
  lng: number;
  source: 'catalog' | 'nominatim';
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

/**
 * Szuka okolicy w Polsce: lokalny katalog + Nominatim OSM (wsie, sołectwa, powiaty).
 * Wyniki DEMO — nie gwarantują aktualności danych placówek.
 */
export async function searchAreas(query: string): Promise<GeocodedArea[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const local = filterPlaceCatalog(q).map(
    (place): GeocodedArea => ({
      ...place,
      source: 'catalog',
    }),
  );

  let remote: GeocodedArea[] = [];
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q,
        countrycodes: 'pl',
        format: 'json',
        addressdetails: '0',
        limit: '6',
      }).toString();

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'eBobo-HackNation/1.0 (demo; contact: local-dev)',
      },
    });

    if (response.ok) {
      const data = (await response.json()) as NominatimResult[];
      remote = data.map((item) => ({
        id: `osm-${item.place_id}`,
        label: shortenDisplayName(item.display_name),
        hint: item.type ?? item.class ?? 'OpenStreetMap',
        lat: Number(item.lat),
        lng: Number(item.lon),
        source: 'nominatim' as const,
      }));
    }
  } catch {
    // Katalog lokalny wystarczy offline / przy błędzie sieci.
  }

  return dedupeAreas([...local, ...remote]).slice(0, 10);
}

export function catalogToArea(place: PlaceSuggestion): GeocodedArea {
  return { ...place, source: 'catalog' };
}

function shortenDisplayName(name: string): string {
  const parts = name.split(',').map((p) => p.trim());
  if (parts.length <= 3) return name;
  return parts.slice(0, 3).join(', ');
}

function dedupeAreas(items: GeocodedArea[]): GeocodedArea[] {
  const seen = new Set<string>();
  const out: GeocodedArea[] = [];
  for (const item of items) {
    const key = `${item.label.toLowerCase()}|${item.lat.toFixed(3)}|${item.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
