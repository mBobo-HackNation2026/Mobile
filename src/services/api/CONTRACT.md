# Kontrakt API eBobo (frontend ↔ FastAPI) — Integration Brief v3

## ENV

```
EXPO_PUBLIC_API_URL=https://…ngrok-free.app
EXPO_PUBLIC_API_BASE_URL=…   # alias
EXPO_PUBLIC_API_MODE=rest|mock
```

## Endpointy

| Metoda | Ścieżka | Status FE |
|--------|---------|-----------|
| GET | `/api/v1/health` | używane |
| POST | `/api/v1/auth/session` | **live** — anonimowa sesja (bootstrap) |
| POST | `/api/v1/auth/mobywatel/login` | **live** — DEMO mObywatel |
| GET | `/api/v1/auth/me` | **live** — profil sesji |
| POST | `/api/v1/eligibility/check/{benefit_code}` | **live** — silnik v2 |
| ~~POST `/api/v1/eligibility/check`~~ | **usunięte** — nie używać |
| POST | `/api/v1/eligibility/evaluate` | hub katalog — mock |
| POST | `/api/v1/calculations/parental` | REST + fallback mock |
| POST | `/api/v1/documents/analyze` | REST + fallback mock |
| GET | `/api/v1/knowledge` | REST + fallback mock |

### Benefit codes (obecnie)

- `zasilek_macierzynski_urlop_macierzynski`
- `zasilek_w_wysokosci_zasilku_macierzynskiego`

### Auth

- Sesja nie jest wymagana do `/eligibility/check/{code}` ani ankiety.
- Awaria `/auth/session` nie blokuje UI.
- Token: SecureStore (native) / sessionStorage (web).
- 401 → wyczyść token, zachowaj lokalną ankietę, zaproponuj nową sesję.

### Eligibility v2

- `plan.weeks` może być `null` — wtedy `duration_description` lub „Okres wymaga ustalenia”.
- `possible_solutions[].related_benefit_code` → CTA „Sprawdź moje uprawnienia” (świadomy drugi request).
- Art. 30 / warnings: ostrożna prezentacja, bez „masz potwierdzone prawo”.

### Tryb `rest` (hybryda hubu)

1. Mock `evaluate` (rodzicielski, radar, sprawy…).
2. Live `POST /eligibility/check/zasilek_macierzynski_urlop_macierzynski`.
3. Wynik API zastępuje kartę `maternity`.
4. 502/błąd → pełny mock + warning.
