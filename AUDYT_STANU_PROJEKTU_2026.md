# AUDYT STANU PROJEKTU — eBobo / HackNation 2026

**Data audytu:** 2026-11-22  
**Repozytorium:** `c:\Users\BARTOSZ\Desktop\Projekty\Mobile`  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**HEAD:** `c85ceaf3bb116bacfee50040c01ddd3721ace7c9` — `feat: add parent plan, map facilities, and calculator wiring`  
**Autor HEAD:** Floro \<bartosz.floryszczak@gmail.com\>  
**Working tree:** czysty względem HEAD; branch zsynchronizowany z `origin/feature/ebobo-frontend-mvp` (0 ahead / 0 behind)  
**Zakres:** wyłącznie ustalenie faktów — **bez zmian kodu aplikacyjnego** w trakcie audytu (ten dokument jest jedynym nowym artefaktem).

**Źródła kontekstu dostępne w repo:** `AGENTS.md`, `README.md`, `src/services/api/CONTRACT.md`, `eBobo_prompt_dla_agenta_P0.md`.  
**Dokumenty organizatora ZUS / wyciągi prawne PDF:** **niedostępne w workspace** — nie zweryfikowano zgodności z briefem źródłowym poza treścią `AGENTS.md`.

---

## I. Executive Summary

1. Repozytorium to **frontend Expo SDK 58** (React Native + Web + TypeScript); **brak kodu backendu FastAPI w tym katalogu** — backend jest zewnętrzny (ngrok), potwierdzony przez `/zus-proxy/api/v1/health`.
2. Główna nawigacja **Plan | Kalendarz | Świadczenia | Mapa | Profil** jest zaimplementowana; **Mój plan** (`/home` → `MyPlanScreen`) generuje lokalną checklistę z `buildParentPlan.ts`.
3. W trybie `EXPO_PUBLIC_API_MODE=rest` **9 świadczeń** ocenia `CatalogEligibilityAdapter` przez live `POST /eligibility/check/{code}` — **bez cichego mocka** dla eligibility/calculate/compare.
4. Kalkulator REST woła `calculate/{code}` oraz `compare/urlop-rodzicielski` bezpośrednio; w trakcie audytu API zwróciło `likely_eligible` i kwotę `28187.60 zł` dla macierzyńskiego.
5. **„Moje sprawy”** (`/sprawy`) i stara checklista `/plan` w REST są **puste funkcjonalnie**, bo adapter katalogowy zwraca `checklist: []`, `deadlines: []` — to regresja względem oczekiwań „spraw z silnika”.
6. Plan lokalny jest oznaczony `isDemo: true` i miesza zadania zdrowotne DEMO z formalnościami; terminy nie pochodzą z FastAPI `plan.deadlines` w hubie katalogowym.
7. README i `CONTRACT.md` są **nieaktualne** względem kodu (dashboard path, hybrid hub, 2 kody świadczeń vs 9).
8. **Brak testów automatycznych** (`*.test.*` / `*.spec.*` = 0); jest `npm run typecheck` (przeszedł) oraz `dist/` po `expo export`.
9. Mapa / mObywatel / PDF to **jawne DEMO**; OpenRouter jest w zależnościach, ale **nie napędza silnika uprawnień**.
10. **Wersja nadaje się do demo konkursowego Web**, pod warunkiem działającego FastAPI+ngrok i prowadzenia jury przez Mój plan + Świadczenia + Kalkulator — nie przez „Moje sprawy” jako źródło checklisty API.

---

## II. Inwentaryzacja funkcjonalności

| Moduł | Stan | Co działa | Czego brakuje | Dowód |
|---|---|---|---|---|
| Welcome / wybór etapu | ✅ | Wybór sytuacji, CTA ankiety/demo | — | Browser `/welcome` 2026-11-22 |
| Ankieta onboarding | ✅ | RHF+Zod, etapy, tri-state „Nie wiem”, pola silnika | Pełne pokrycie wszystkich pól OpenAPI nie auditowane E2E pole-po-polu | `src/features/onboarding/schema.ts` L45–94 |
| Sesja anonimowa / mObywatel DEMO | 🟡 | Bootstrap, login DEMO, logout+czyszczenie (wcześniej E2E) | Awaria sesji nie blokuje oceny; nie re-testowano logout w tym audycie | `SessionCard.tsx`, `useAuthStore.ts` |
| Mój plan (checklista P0) | 🟡 | Lokalne zadania wg etapu, statusy, CTA | Nie jest wynikiem FastAPI; `isDemo: true`; daty demo mogą być „po terminie” | `buildParentPlan.ts` L31–72; browser `/home` |
| Moje sprawy / stara checklista | 🔴 | UI istnieje | W REST: pusta checklista i radar | `CatalogEligibilityAdapter.ts` L89–94; browser `/sprawy` |
| Kalendarz | 🟡 | Siatka, notatki persist, terminy z planu lokalnego + pine mapy | Terminy API hubu puste; przypomnienia web ograniczone | `CalendarScreen.tsx` L54–61; `scheduleReminders.ts` L110–115 |
| Przypomnienia | 🟡 | Kod schedule + panel UI | Web: tylko przy otwartej app; natywne nie testowane | `scheduleReminders.ts` L19–25, L71–72 |
| Hub 9 świadczeń | ✅ | Live FastAPI, grupy statusów, braki danych | — | Browser `/benefits`; curl eligibility HTTP 200 |
| Szczegóły / rozwiązania | 🟡 | Warunki, plan null, warnings, CTA kalkulatora | Alternatywy zależą od BE; część ścieżek ostrożna | `BenefitDetailScreen.tsx`, `mapEligibilityCheckToBenefit.ts` |
| Kalkulator + compare | ✅ | REST calculate/compare, null≠0, disclaimer | Legacy `CalculatorService` w REST rzuca; brak testów kwot | `CalculatorScreen.tsx`; curl calculate 28187.60 |
| Dokumenty / PDF | 🟡 | UI upload, fallback mock | OCR/analiza nie weryfikowana E2E w tym audycie; REST+fallback | `DocumentsScreen.tsx` L58+ |
| Dane ZUS / mObywatel | 🟡 | Ekran DEMO z banerem | Brak prawdziwej integracji (zgodnie z założeniem) | `ZusDemoScreen.tsx` |
| Mapa placówek | 🟡 | DEMO fixtures, OSM preview, GPS/szukanie | P2 względem briefu; nie NFZ produkcyjnie | `MapDemoScreen.tsx`, `facilitiesDemo.ts` |
| Inne świadczenia (poza ZUS) | 🟡 | Lista źródeł | Bez silnika oceny | `OtherBenefitsScreen.tsx` |
| OpenRouter / AI | ⚪/❔ | Scaffold + smoke script | Nie używane w ścieżce uprawnień UI | `src/services/openrouter/*`, `scripts/smoke-openrouter.mjs` |
| Testy automatyczne | ⚪ | — | Brak plików testowych | glob `**/*.{test,spec}.*` → 0 |
| Backend w monorepo | ⚪ | — | Brak katalogu backend | `Test-Path backend` → False |
| Docs organizatora PDF | ⚪ | — | Brak w workspace | brak plików PDF/DOCX |

**Legenda stanów:** ✅ sprawdzone · 🟡 częściowe · 🔴 błąd/regresja · ⚪ brak · ❔ niezweryfikowane

---

## III. Architektura techniczna

### Stack (fakt z `package.json`)

- Expo `~58.0.26`, React Native `0.88.1`, React `19.3.0`, `react-native-web`
- Expo Router, TypeScript `~6.0.3`
- Zustand, TanStack Query, React Hook Form, Zod, date-fns
- AsyncStorage (persystencja profilu/kalendarza/ulubionych)
- expo-notifications, expo-location, expo-document-picker, expo-secure-store
- `@openrouter/sdk` (pobocznie)

### Struktura (istotne)

```
src/app/                 # trasy Expo Router
src/features/            # ekrany domenowe (plan, benefits, calculator, map, …)
src/services/api/        # fasada REST/mock, adaptery, httpClient, proxy config
src/services/mock/       # fixtures DEMO
src/store/               # Zustand
src/types/               # modele domenowe
metro.config.js          # /zus-proxy → FastAPI (CORS Web)
```

### Przepływ danych

1. **Ankieta** → `useUserJourneyStore` (persist `ebobo-user-journey`).
2. **Ocena** → `eligibilityService.evaluate(profile)`:
   - `mock` → `MockEligibilityAdapter`
   - `rest` → `CatalogEligibilityAdapter` (9× `checkBenefitEligibility`)
3. **Kwoty** → `calculateBenefitAmount` / `compareParentalLeave` (omijają legacy `calculatorService` w REST).
4. **Plan lokalny** → `buildParentPlan(profile)` niezależnie od FastAPI checklist.
5. **Web API base** → `/zus-proxy` (`config.ts`); native → URL z `.env`.

### Martwy / legacy kod (stwierdzony)

| Element | Status |
|---|---|
| `HybridEligibilityAdapter.ts` | **nieimportowany** (brak `new Hybrid` / importów) |
| `RestCalculatorAdapter` | niepodpięty w `index.ts` REST |
| `/plan` „Checklista (stara)” | w secondary nav; oparta o pustą checklistę API w REST |
| `CONTRACT.md` | opisuje hybrydę i 2 kody — **nieaktualny** względem `CatalogEligibilityAdapter` |
| `README.md` ścieżka `/dashboard` | home jest `/home` → `MyPlanScreen` |

### Baza danych

- **Brak lokalnej DB aplikacji.** Stan: AsyncStorage / sessionStorage + odpowiedź FastAPI (zewnętrzny SQLite/Postgres poza tym repo — nie audytowany kodowo).

---

## IV. Wyniki testów

| Test | Wynik | Wykonane czynności | Błąd / obserwacje |
|---|---|---|---|
| `npm run typecheck` | PASS | `tsc --noEmit` | exit 0 |
| Testy jednostkowe/E2E automatyczne | NIE WYKONANO | brak plików testowych | brak runnera w scripts |
| Expo Web `localhost:8081` | PASS | HTTP GET | 200 |
| Proxy health | PASS | GET `/zus-proxy/api/v1/health` | `{"status":"ok",...}` |
| Eligibility live | PASS | POST `.../eligibility/check/zasilek_macierzynski_urlop_macierzynski` z body JSON (plik) | HTTP 200, `likely_eligible`, plan 20 tyg. |
| Calculate live | PASS | POST `.../benefits/calculate/...` | `total_amount_zl=28187.60`, 140 dni |
| Browser welcome | PASS | `/welcome` | 5 etapów + CTA |
| Browser demo → benefits | PASS | wczytanie profilu + `/benefits` | 9 świadczeń FastAPI, braki danych widoczne |
| Browser Mój plan | PASS | `/home` | 14 zadań lokalnych, najbliższy termin |
| Browser Moje sprawy | FAIL funkcjonalny | `/sprawy` | „Brak terminów…”, „Brak pozycji w tym filtrze” |
| Build produkcyjny `expo export` | ❔ | `dist/` istnieje | nie uruchamiano świeżego `export` w tym audycie |
| Android / iOS | ❔ | — | nie uruchamiano |
| Hosting produkcyjny | ❔ | — | nie weryfikowano |
| Powiadomienia push natywne | ❔ | — | tylko analiza kodu |
| Logout E2E | ❔ w tym audycie | wcześniej raportowane PASS | nie powtarzano dziś |

**Uwaga:** wcześniejsze `Invoke-RestMethod` z JSON w PowerShell potrafiło dać fałszywe 500/422 przez uszkodzenie body — wiarygodne wywołania: `curl --data-binary @file`.

---

## V. Wykryte błędy

### BUG-001 — Critical (dla ścieżki „sprawy z API”)
- **Opis:** W REST `CatalogEligibilityAdapter` zawsze ustawia `deadlines: []`, `checklist: []`, `deadlineRadar: []`, `documentAssistant.applications: []`.
- **Lokalizacja:** `src/services/api/CatalogEligibilityAdapter.ts` ok. L89–99.
- **Odtworzenie:** tryb rest → ukończona ankieta/demo → `/sprawy`.
- **Wpływ:** „Moje sprawy” i stara `/plan` wyglądają na zepsute mimo działającego Mój plan.
- **Naprawa (rekomendacja):** mapować `plan`/terminy/dokumenty z wyników `eligibility/check` do checklisty ALBO przekierować UI spraw na `buildParentPlan` + procedure z benefitów; zaktualizować CONTRACT.

### BUG-002 — High
- **Opis:** Dokumentacja (`README.md`, `CONTRACT.md`) opisuje nieaktualną architekturę (hybrid hub, 2 kody, `/dashboard`, calculations/parental jako główny kalkulator).
- **Lokalizacja:** `README.md` L28–36; `CONTRACT.md` L21–49.
- **Wpływ:** mylące dla jury/agenta; ryzyko „naprawiania” złego kontraktu.
- **Naprawa:** zsynchronizować docs z `index.ts` + 9 kodów.

### BUG-003 — High (ryzyko demo)
- **Opis:** Zależność od ephemeral ngrok URL w `.env` / `app.json` extra.
- **Lokalizacja:** `.env` (gitignored), `app.json` extra `apiUrl` (w HEAD).
- **Wpływ:** padnięcie tunelu = brak ocen/kalkulacji na Web mimo działającego UI.
- **Naprawa:** checklista startowa + świeży URL przed jury; health-check na ekranie startowym.

### BUG-004 — Medium
- **Opis:** Profile demo z datami względnie „przeszłymi” względem daty systemowej generują absurdalne etykiety (np. „42. tydzień ciąży” przy dacie 2026-06-15 gdy „dziś” to 2026-11-22).
- **Lokalizacja:** `fixtures.ts` `pregnant_employee.eventDate`; `timeline.ts` / `buildParentPlan`.
- **Wpływ:** wiarygodność planu zdrowotnego przed jury.
- **Naprawa:** przesunąć daty demo względem `new Date()` albo oznaczyć mocniej jako fixture.

### BUG-005 — Medium
- **Opis:** Dwa równoległe modele „planu”: lokalny `buildParentPlan` vs procedura z FastAPI na karcie świadczenia — użytkownik może dostać sprzeczne terminy/dokumenty.
- **Lokalizacja:** `features/plan/*` vs `mapEligibilityCheckToBenefit.ts` `mapPlanToProcedure`.
- **Wpływ:** niespójność P0 checklisty z formalnościami świadczenia.
- **Naprawa:** jawna hierarchia źródeł (API > lokalne DEMO) w UI.

### BUG-006 — Medium
- **Opis:** Przypomnienia na Web nie są prawdziwym schedulerem w tle.
- **Lokalizacja:** `scheduleReminders.ts` L110–115 (+ komentarz w UI kalendarza).
- **Wpływ:** P0 „przypomnienia” częściowo niespełnione na demonstracji webowej.
- **Naprawa:** komunikat już częściowo jest; nie obiecywać push na Web.

### BUG-007 — Low
- **Opis:** Martwy `HybridEligibilityAdapter` / nieużywany `RestCalculatorAdapter` w ścieżce REST.
- **Lokalizacja:** `HybridEligibilityAdapter.ts`, `RestAdapter.ts`, `index.ts`.
- **Wpływ:** dług techniczny, mylenie agentów.
- **Naprawa:** usunąć lub oznaczyć `@deprecated` po decyzji produktowej.

### BUG-008 — Low
- **Opis:** W commit `c85ceaf` trafił plik zadaniowy `eBobo_prompt_dla_agenta_P0.md` (nie jest kodem produktowym).
- **Wpływ:** szum w repo.
- **Naprawa:** przenieść do docs wewnętrznych lub usunąć z brancha demo.

---

## VI. Rozbieżności z założeniami

### Udokumentowane (fakt vs AGENTS.md / brief P0 w repo)

| Założenie | Implementacja | Typ |
|---|---|---|
| FE nie liczy prawa/kwot lokalnie | Kwoty/eligibility z FastAPI w REST | zgodne |
| Checklista P0 spersonalizowana | Tak, ale **lokalny builder**, nie silnik prawny | częściowo zgodne / ryzyko |
| Kalendarz z terminów użytkownika | Tak z planu lokalnego + pine; **nie** z `deadlines` API katalogu | częściowo |
| Kalkulator + compare | Zaimplementowane REST | zgodne |
| Web responsywny obowiązkowy | Expo Web działa | zgodne (test mobile viewport wcześniej) |
| Symulowane ZUS/mObywatel | Tak, z banerami DEMO | zgodne |
| Dokumentacja organizatora jako źródło prawdy | **Brak PDF w workspace** | nie do weryfikacji tutaj |
| Nawigacja Plan\|Kalendarz\|Świadczenia\|Mapa\|Profil | Zgodna | zgodne |
| Mapa to P2 / poza rdzeniem ZUS | Mapa w dolnej nawigacji | rozbieżność priorytetów (świadoma) |

### Podejrzenia (nie potwierdzone pełnym audytem prawnym)

- Lokalne zadania w `buildParentPlan` (GBS, ZAM, okna urlopowe) mogą być **uproszczeniami** bez weryfikacji względem ustawy — oznaczone DEMO, ale jury może je odczytać jako reguły.
- `CONTRACT.md` sugeruje stare zachowanie hybrid — podejrzenie, że część ekranów rozszerzeń (`DeadlineRadar`, postpartum kit) **straciła dane** po przejściu na Catalog adapter (potwierdzone pustkami na `/sprawy`).

---

## VII. Ocena gotowości do demo

| Kategoria | Ocena | Uzasadnienie |
|---|---|---|
| Gotowość funkcjonalna | **72%** | Główny flow Web (ankieta/demo → plan → świadczenia → kalkulator) działa; sprawy/API checklista puste. |
| Stabilność techniczna | **70%** | typecheck OK, proxy OK przy żywym BE; zależność ngrok; brak testów automatycznych. |
| Zgodność z wyzwaniem | **75%** | Personalizacja, świadczenia, kalkulator, DEMO ZUS, Web — tak; docs organizatora nie w repo. |
| Poprawność logiki świadczeń | **65%** | FE nie liczy sam; BE live działa dla sprawdzonych endpointów; lokalny plan ≠ prawo; uproszczenia compare 81.5%/70%. |
| Gotowość interfejsu | **78%** | Spójna nawigacja, banery DEMO, responsywność Web; część secondary ekranów myląca. |
| Kompletny scenariusz demonstracyjny | **80%** | Da się pokazać jury 3 scenariusze; wymaga żywego API i omijania pustych „Spraw”. |

**Nie oceniano:** produkcyjnego hostingu, Android/iOS natywnych buildów.

---

## VIII. Plan naprawczy

### 1. Krytyczne blokerów demo
1. **Przywrócić treść „Moje sprawy” / radar w REST** albo ukryć pusty ekran i linkować do Mój plan + benefit procedure — złożoność **M**, zależność: decyzja UX + mapowanie API.
2. **Checklista startowa ngrok/health** przed wejściem jury — złożoność **S**.

### 2. Brakujące / uszkodzone P0
3. Ujednolicić źródło terminów kalendarza (API plan vs lokalny builder) z jasnym labelingiem — **M**.
4. Zaktualizować daty profili demo względem „dziś” — **S**.

### 3. Poprawność świadczeń i terminów
5. Zsynchronizować `CONTRACT.md` / README z 9 kodami i Catalog adapter — **S**.
6. Dla `0 zł/0 dni` i `plan: null` utrzymać neutralne komunikaty; zgłosić BE rozróżnienie „brak wymiaru” vs zero — **S** (FE) / **M** (BE).

### 4. Usprawnienia P1
7. Bogatsze formalności wniosków z pól `plan` API na karcie świadczenia — **M**.
8. Lepsze pokrycie drugiego rodzica w ankiecie UI — **M**.

### 5. Odłożyć
9. Mapa / społeczność / OpenRouter w produkcie — **L** / poza MVP.
10. Usuwanie martwego Hybrid adaptera — **S**, po stabilizacji demo.
11. Testy natywne Android/iOS — poza obecnym zakresem demo Web.

---

## IX. Co powinienem zrobić jako następne? (5 działań)

1. **Naprawić pustą ścieżkę `/sprawy` w REST** (mapowanie z benefit `plan`/`procedure` lub pivot UI na Mój plan) — największy wpływ na spójność P0.
2. **Zaktualizować README + CONTRACT** do faktycznego kontraktu 9 świadczeń / Catalog / calculate / compare / zus-proxy.
3. **Ustabilizować daty i copy profili demo** pod dzień konkursu (unikać „42. tygodnia”).
4. **Dodać widoczny health-check FastAPI** na starcie/profilu (OK/FAIL) żeby jury nie oglądało pustych błędów sieci.
5. **Jedna checklista demo 3 scenariuszy** (macierzyński → compare → przeszkoda) jako plik operacyjny dla prezentera — bez nowych feature.

---

## Dodatek A — Dowody komend

```text
git rev-parse HEAD
→ c85ceaf3bb116bacfee50040c01ddd3721ace7c9

npm run typecheck
→ exit 0

GET http://localhost:8081 → 200
GET http://localhost:8081/zus-proxy/api/v1/health → status ok

POST .../eligibility/check/zasilek_macierzynski_urlop_macierzynski
→ HTTP 200 likely_eligible

POST .../benefits/calculate/zasilek_macierzynski_urlop_macierzynski
→ total_amount_zl 28187.60 / total_days 140
```

## Dodatek B — Klasyfikacja obszarów briefu audytowego

| Obszar | Klasyfikacja | Komentarz |
|---|---|---|
| A Onboarding | ✅ | Sprawdzone kod + częściowo UI |
| B Checklista (Mój plan) | 🟡 | Działa lokalnie; nie z API |
| B Checklista (Sprawy) | 🔴 | Pusta w REST |
| C Kalendarz | 🟡 | Działa z planu lokalnego |
| C Przypomnienia | 🟡 | Web ograniczone |
| D Kalkulator | ✅ | Live FastAPI |
| E Wiedza prawna | 🟡 | Z BE na kartach; lokalny plan DEMO; brak PDF organizatora |
| F UX ścieżka | 🟡 | Główna OK; secondary myląca |
| G Integracje | 🟡 | FastAPI real; ZUS/mapa/PDF DEMO |

---

*Koniec audytu. Napraw nie rozpoczynać bez kolejnej instrukcji.*
