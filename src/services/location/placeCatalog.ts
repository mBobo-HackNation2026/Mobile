/** Lokalny katalog okolic (miasta, miasteczka, wsie) — szybkie podpowiedzi bez GPS. */
export interface PlaceSuggestion {
  id: string;
  label: string;
  hint: string;
  lat: number;
  lng: number;
}

export const PLACE_CATALOG: PlaceSuggestion[] = [
  { id: 'warszawa', label: 'Warszawa', hint: 'miasto', lat: 52.2297, lng: 21.0122 },
  { id: 'krakow', label: 'Kraków', hint: 'miasto', lat: 50.0647, lng: 19.945 },
  { id: 'gdansk', label: 'Gdańsk', hint: 'miasto', lat: 54.352, lng: 18.6466 },
  { id: 'wroclaw', label: 'Wrocław', hint: 'miasto', lat: 51.1079, lng: 17.0385 },
  { id: 'poznan', label: 'Poznań', hint: 'miasto', lat: 52.4064, lng: 16.9252 },
  { id: 'lublin', label: 'Lublin', hint: 'miasto', lat: 51.2465, lng: 22.5684 },
  { id: 'bialystok', label: 'Białystok', hint: 'miasto', lat: 53.1325, lng: 23.1688 },
  { id: 'rzeszow', label: 'Rzeszów', hint: 'miasto', lat: 50.0412, lng: 21.9991 },
  { id: 'zakopane', label: 'Zakopane', hint: 'miasto', lat: 49.2992, lng: 19.9496 },
  { id: 'nowy-targ', label: 'Nowy Targ', hint: 'miasto', lat: 49.4778, lng: 20.0322 },
  { id: 'pulawy', label: 'Puławy', hint: 'miasto', lat: 51.4166, lng: 21.9694 },
  { id: 'lomza', label: 'Łomża', hint: 'miasto', lat: 53.1781, lng: 22.0594 },
  { id: 'suwalki', label: 'Suwałki', hint: 'miasto', lat: 54.111, lng: 22.9308 },
  { id: 'pszczyna', label: 'Pszczyna', hint: 'miasto', lat: 49.978, lng: 18.9538 },
  { id: 'kazimierz', label: 'Kazimierz Dolny', hint: 'miasto', lat: 51.3222, lng: 21.9486 },
  { id: 'bialobrzegi', label: 'Białobrzegi', hint: 'miasto / okolice', lat: 51.6474, lng: 20.9458 },
  { id: 'grodzisk', label: 'Grodzisk Mazowiecki', hint: 'miasto', lat: 52.1086, lng: 20.6333 },
  { id: 'otwock', label: 'Otwock', hint: 'miasto', lat: 52.1057, lng: 21.2613 },
  { id: 'konstancin', label: 'Konstancin-Jeziorna', hint: 'miasto', lat: 52.0938, lng: 21.1176 },
  { id: 'piaseczno', label: 'Piaseczno', hint: 'miasto', lat: 52.0813, lng: 21.0239 },
  { id: 'zyrardow', label: 'Żyrardów', hint: 'miasto', lat: 52.0488, lng: 20.446 },
  { id: 'siedlce', label: 'Siedlce', hint: 'miasto', lat: 52.1674, lng: 22.2901 },
  { id: 'ciechanow', label: 'Ciechanów', hint: 'miasto', lat: 52.8814, lng: 20.6199 },
  { id: 'mlawa', label: 'Mława', hint: 'miasto', lat: 53.1128, lng: 20.384 },
  { id: 'ostroleka', label: 'Ostrołęka', hint: 'miasto', lat: 53.0862, lng: 21.5757 },
  { id: 'radom', label: 'Radom', hint: 'miasto', lat: 51.4027, lng: 21.1471 },
  { id: 'kielce', label: 'Kielce', hint: 'miasto', lat: 50.8661, lng: 20.6286 },
  { id: 'tarnow', label: 'Tarnów', hint: 'miasto', lat: 50.0121, lng: 20.9858 },
  { id: 'nowy-sacz', label: 'Nowy Sącz', hint: 'miasto', lat: 49.6217, lng: 20.6971 },
  { id: 'sanok', label: 'Sanok', hint: 'miasto', lat: 49.555, lng: 22.2056 },
  { id: 'bieszczady', label: 'Ustrzyki Dolne', hint: 'miasto / Bieszczady', lat: 49.4304, lng: 22.594 },
  { id: 'elk', label: 'Ełk', hint: 'miasto', lat: 53.828, lng: 22.3647 },
  { id: 'giżycko', label: 'Giżycko', hint: 'miasto', lat: 54.0401, lng: 21.7591 },
  { id: 'lebork', label: 'Lębork', hint: 'miasto', lat: 54.5394, lng: 17.7501 },
  { id: 'slupsk', label: 'Słupsk', hint: 'miasto', lat: 54.4641, lng: 17.0285 },
  { id: 'koszalin', label: 'Koszalin', hint: 'miasto', lat: 54.1943, lng: 16.1715 },
  { id: 'szczecinek', label: 'Szczecinek', hint: 'miasto', lat: 53.708, lng: 16.699 },
  { id: 'pila', label: 'Piła', hint: 'miasto', lat: 53.1515, lng: 16.738 },
  { id: 'leszno', label: 'Leszno', hint: 'miasto', lat: 51.8403, lng: 16.5749 },
  { id: 'kalisz', label: 'Kalisz', hint: 'miasto', lat: 51.7605, lng: 18.091 },
  { id: 'konin', label: 'Konin', hint: 'miasto', lat: 52.2233, lng: 18.2512 },
  { id: 'ostrow-wlkp', label: 'Ostrów Wielkopolski', hint: 'miasto', lat: 51.655, lng: 17.8069 },
  { id: 'jarocin', label: 'Jarocin', hint: 'miasto', lat: 51.9727, lng: 17.5015 },
  { id: 'opole', label: 'Opole', hint: 'miasto', lat: 50.6751, lng: 17.9213 },
  { id: 'nysa', label: 'Nysa', hint: 'miasto', lat: 50.4738, lng: 17.3325 },
  { id: 'klodzko', label: 'Kłodzko', hint: 'miasto', lat: 50.4344, lng: 16.6615 },
  { id: 'jelenia', label: 'Jelenia Góra', hint: 'miasto', lat: 50.9036, lng: 15.7344 },
  { id: 'walbrzych', label: 'Wałbrzych', hint: 'miasto', lat: 50.784, lng: 16.284 },
  { id: 'legnica', label: 'Legnica', hint: 'miasto', lat: 51.207, lng: 16.155 },
  { id: 'zielona', label: 'Zielona Góra', hint: 'miasto', lat: 51.9355, lng: 15.5064 },
  { id: 'gorzow', label: 'Gorzów Wielkopolski', hint: 'miasto', lat: 52.7368, lng: 15.2288 },
  { id: 'chelm', label: 'Chełm', hint: 'miasto', lat: 51.1431, lng: 23.4716 },
  { id: 'zamosc', label: 'Zamość', hint: 'miasto', lat: 50.7231, lng: 23.25196 },
  { id: 'biala-podl', label: 'Biała Podlaska', hint: 'miasto', lat: 52.0333, lng: 23.1167 },
  { id: 'hrubieszow', label: 'Hrubieszów', hint: 'miasto', lat: 50.805, lng: 23.8925 },
  { id: 'parczew', label: 'Parczew', hint: 'miasto / wieś okolice', lat: 51.6403, lng: 22.9006 },
  { id: 'wysokie', label: 'Wysokie Mazowieckie', hint: 'miasto', lat: 52.9167, lng: 22.5167 },
  { id: 'grajewo', label: 'Grajewo', hint: 'miasto', lat: 53.6473, lng: 22.4553 },
  { id: 'augustow', label: 'Augustów', hint: 'miasto', lat: 53.843, lng: 22.9798 },
];

export function filterPlaceCatalog(query: string, limit = 8): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return PLACE_CATALOG.filter(
    (place) =>
      place.label.toLowerCase().includes(q) ||
      place.hint.toLowerCase().includes(q),
  ).slice(0, limit);
}
