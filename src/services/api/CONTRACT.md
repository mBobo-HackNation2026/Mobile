# Kontrakt API eBobo (frontend ↔ FastAPI)

Stan na P0/P0.1 + naprawę formalności (Catalog adapter).

## ENV

```
EXPO_PUBLIC_API_MODE=rest|mock
EXPO_PUBLIC_API_URL=https://…ngrok-free.app
EXPO_PUBLIC_API_BASE_URL=…   # alias
```

**Expo Web:** baza URL klienta = `/zus-proxy` (`metro.config.js` → upstream z ENV).  
**Native:** bezpośredni `EXPO_PUBLIC_API_URL`.

## Endpointy używane przez FE

| Metoda | Ścieżka | Status FE |
|--------|---------|-----------|
| GET | `/api/v1/health` | live — baner `ApiHealthBanner` |
| POST | `/api/v1/auth/session` | live — sesja anonimowa |
| POST | `/api/v1/auth/mobywatel/login` | live — DEMO |
| GET | `/api/v1/auth/me` | live |
| POST | `/api/v1/auth/refresh` | live (store) |
| POST | `/api/v1/auth/logout` | live |
| POST | `/api/v1/eligibility/check/{benefit_code}` | **live × 9** — `CatalogEligibilityAdapter` |
| POST | `/api/v1/legal-advisor/explain/{benefit_code}` | wyjaśnienie AI/fallback — ten sam payload co eligibility/check; timeout FE 25s |
| POST | `/api/v1/benefits/calculate/{benefit_code}` | **live** — kalkulator |
| POST | `/api/v1/benefits/compare/urlop-rodzicielski` | **live** — 3 warianty |
| GET | `/api/v1/formalities/{benefit_code}` | **live** — `BenefitFormalitiesPanel` (Etap 17); przy błędzie UI pokazuje `procedure` z eligibility |
| GET | `/api/v1/formalities/general` | **live** — client FE |
| POST | `/api/v1/documents/analyze` | REST + jawny fallback mock |
| GET | `/api/v1/knowledge` | REST + jawny fallback mock |

### Nieużywane / legacy w REST P0

- `HybridEligibilityAdapter` — niepodpięty
- `POST /api/v1/calculations/parental` — kalkulator REST go nie woła
- `POST /api/v1/eligibility/evaluate` — hub mock; REST używa katalogu 9× check

## 9 kodów świadczeń

1. `zasilek_macierzynski_urlop_macierzynski`
2. `zasilek_w_wysokosci_zasilku_macierzynskiego`
3. `urlop_ojcowski`
4. `urlop_rodzicielski`
5. `zasilek_chorobowy_w_ciazy`
6. `swiadczenie_rehabilitacyjne`
7. `uzupelniajacy_urlop_macierzynski`
8. `urlop_na_warunkach_urlopu_macierzynskiego`
9. `zasilek_pogrzebowy_martwe_urodzenie`

## Formalności (checklista / terminy)

`CatalogEligibilityAdapter` po ocenie 9 świadczeń wywołuje `deriveFormalitiesFromBenefits`:

- pozycje z `plan` / `procedure` → checklista + radar (**źródło FastAPI**),
- daty kalendarza tylko gdy `submitBy` zaczyna się od `YYYY-MM-DD`,
- opisy tekstowe terminów → radar z ostrzeżeniem, bez sztucznej daty,
- `documentAssistant.applications` z dokumentów planu API.

Ekrany `/sprawy` i `/plan` **dokładają** formalne zadania z lokalnego `buildParentPlan` (kategorie `zus` | `admin` | `deadline`), oznaczone `[Plan lokalny DEMO]`.

`/home` (Mój plan) pozostaje lokalną osią czasu DEMO i **nie** twierdzi, że jest wyrokiem silnika prawnego.

## Auth

- Ocena publiczna nie wymaga konta.
- Awaria `/auth/session` nie blokuje ankiety/eligibility.
- Token: SecureStore (native) / sessionStorage (web).
- Logout czyści Zustand + TanStack Query + ulubione/kalendarz/dokumenty.

## Zasady REST

- Eligibility / calculate / compare: **brak cichego mocka**.
- `null` kwot/okresów nie mapować na `0`.
- `plan: null` → brak lokalnego dopisywania dokumentów „na sztywno”.
