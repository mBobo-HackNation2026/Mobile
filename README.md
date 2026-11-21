# eBobo

Frontend demonstracyjny HackNation 2026 / wyzwanie ZUS „Zasiłkowy Przewodnik Przyszłego Rodzica”.

eBobo prowadzi rodzica przez formalności: **co przysługuje, ile, kiedy i gdzie to załatwić** — bez trackera rozwoju dziecka.

## Stack

Expo SDK 58 · React Native · React Native Web · TypeScript strict · Expo Router · Zustand · TanStack Query · React Hook Form · Zod · date-fns

## Uruchomienie

```bash
npm install
cp .env.example .env
npm run web
```

### Mock vs FastAPI

| Zmienna | Opis |
|---|---|
| `EXPO_PUBLIC_API_MODE` | `mock` (domyślnie) albo `rest` |
| `EXPO_PUBLIC_API_BASE_URL` | np. `http://localhost:8000` |

Fasada: `src/services/api` → `eligibility` / `calculator` / `documents` / `knowledge`.

## Ścieżka demo

1. `/` — wybór sytuacji + „Sprawdź swoje uprawnienia”
2. `/onboarding` — ankieta warunkowa (RHF + Zod)
3. `/dashboard` — Mój plan
4. `/calendar` — terminy, notatki, przypomnienia
5. `/documents` — ZAM + upload PDF (demo)
6. `/zus` — symulacja mObywatel / eZUS
7. `/calculator` — placeholder pod FastAPI

Wszystkie oceny uprawnień i kwoty są **symulacją / wynikiem API** — nie decyzją ZUS.
