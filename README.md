# eBobo

**Zasiłkowy Przewodnik Przyszłego Rodzica** — HackNation 2026 / wyzwanie ZUS.

> Powiedz nam, jaka jest Twoja sytuacja — pokażemy, jakie świadczenia mogą Ci przysługiwać, ile możesz otrzymać, czego brakuje i co zrobić dalej.

Ocena jest **informacyjna** i nie stanowi decyzji ZUS.

## Stack

Expo SDK 58 · React Native · React Native Web · TypeScript strict · Expo Router · Zustand · TanStack Query · React Hook Form · Zod · date-fns

Backend FastAPI jest **osobnym serwisem** (nie w tym repo).

## Uruchomienie (Web)

```bash
npm install
cp .env.example .env
# EXPO_PUBLIC_API_MODE=rest
# EXPO_PUBLIC_API_URL=https://<stabilny-backend>
npx expo start --web --port 8081
```

- App: `http://localhost:8081`
- Health (Web proxy): `http://localhost:8081/zus-proxy/api/v1/health`

### Zmienne

| Zmienna | Opis |
|---|---|
| `EXPO_PUBLIC_API_MODE` | `mock` \| `rest` |
| `EXPO_PUBLIC_API_URL` | URL FastAPI |

W `rest`: eligibility / calculate / compare **bez** cichego mocka. Dokumenty: jawny fallback.

**Nie commituj** `.env` z sekretami (np. kluczami AI).

## Nawigacja

**Plan · Sprawy · Świadczenia · Kalkulator · Profil**

| Trasa | Rola |
|---|---|
| `/benefits` | Hub 9 świadczeń (domyślny po onboardingu) |
| `/benefits/[id]` | Wynik → kwota → dokumenty → oficjalne linki |
| `/calculator?benefit=` | Calculate + compare (kontekst świadczenia) |
| `/sample-cases` | **Sprawdź przykładową sprawę** (syntetyczne, bez PDF ZUS) |
| `/help` | Organizacje charytatywne + odpis aktu gov.pl |
| `/sprawy` | Checklista formalności |
| `/zus` | Symulacja danych ZUS |
| `/documents` | Upload PDF → analyze (gdy BE działa) |

## Demo dla jury

1. Welcome → „Sprawdź przykładową sprawę” **lub** ankieta.
2. Wybierz S1 / S2 → oceń świadczenia → oblicz kwotę → eZUS/pracodawca.
3. `/help` przy stratach / wcześniakach.
4. Paczka konkursowa: `SUBMISSION.md`, `ETAP17_FRONTEND_RELEASE_READINESS.md`.

**Chronione PDF spraw ZUS nie są w repozytorium** (zakaz rozpowszechniania).

## Skrypty

```bash
npm run typecheck
npm run test:regression
npm run export:web
npm run deploy:web          # wymaga skonfigurowanego EAS
```

## Dokumentacja

- `SUBMISSION.md` — paczka oddania
- `docs/PRESENTATION_OUTLINE.md` — slajdy ≤10
- `src/services/api/CONTRACT.md` — endpointy
- Raporty `ETAP*.md`, `HACKATHON_2026_FINAL_COMPLIANCE_AUDIT.md`

## AI

`POST /legal-advisor/explain/{benefit_code}` — wyjaśnienie wyniku silnika. UI oznacza, że AI nie przyznaje świadczenia.
