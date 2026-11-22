# eBobo

Frontend demonstracyjny HackNation 2026 / wyzwanie ZUS „Zasiłkowy Przewodnik Przyszłego Rodzica”.

eBobo prowadzi rodzica przez formalności: **co przysługuje, ile, kiedy i gdzie to załatwić** — bez trackera rozwoju dziecka.

## Stack

Expo SDK 58 · React Native · React Native Web · TypeScript strict · Expo Router · Zustand · TanStack Query · React Hook Form · Zod · date-fns

Backend (osobny serwis FastAPI) nie jest częścią tego repozytorium.

## Uruchomienie (demo Web)

```bash
npm install
cp .env.example .env   # ustaw EXPO_PUBLIC_API_MODE=rest oraz URL FastAPI/ngrok
npx expo start --web --port 8081
```

Sprawdź:

- `http://localhost:8081`
- `http://localhost:8081/zus-proxy/api/v1/health` (Web — proxy Metro omija CORS)

### Mock vs FastAPI

| Zmienna | Opis |
|---|---|
| `EXPO_PUBLIC_API_MODE` | `mock` albo `rest` |
| `EXPO_PUBLIC_API_URL` | URL FastAPI (preferowane) |
| `EXPO_PUBLIC_API_BASE_URL` | alias |

W trybie **rest** (Web): klient woła `/zus-proxy/...` → Metro → FastAPI.  
Eligibility / calculate / compare: **bez cichego mocka**. Dokumenty/knowledge: jawny fallback mock.

## Nawigacja

**Plan | Kalendarz | Świadczenia | Mapa | Profil**

| Trasa | Rola |
|---|---|
| `/home` | **Mój plan** — lokalna oś czasu DEMO (`buildParentPlan`) |
| `/sprawy` | Formalności: checklista z **FastAPI** + uzupełnienie lokalne DEMO |
| `/plan` | Ta sama checklista z filtrami |
| `/benefits` | 9 świadczeń — `POST /eligibility/check/{code}` |
| `/calculator` | `calculate/{code}` + `compare/urlop-rodzicielski` |
| `/calendar` | Terminy z planu lokalnego + (gdy ISO) z API + pine mapy |
| `/map` | Placówki DEMO / OSM |
| `/demo` | Profile wejściowe DEMO (daty względne) |

## Źródła danych (ważne)

1. **FastAPI** — ocena uprawnień, kwoty, procedury wniosków (prawo / silnik).
2. **Plan lokalny DEMO** — checklista zdrowotna i orientacyjne terminy (`/home`); nie jest decyzją ZUS.
3. **Mapa / ZUS / PDF / mObywatel** — integracje demonstracyjne, oznaczone w UI.

## Skrypty

```bash
npm run typecheck
npm run test:regression
npm run export:web
```

## Ścieżka demo (jury)

1. Welcome → gość → `/demo` → profil (np. pracownica w ciąży).
2. `/benefits` → szczegóły macierzyńskiego.
3. `/calculator` → kwota + (dla rodziców) porównanie 3 wariantów.
4. `/home` + `/sprawy` — plan lokalny vs formalności API.

Wszystkie oceny i kwoty to **symulacja / wynik API** — nie decyzja ZUS.
