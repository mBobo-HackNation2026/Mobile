# Kontrakt API eBobo (frontend ↔ FastAPI)

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
| POST | `/api/v1/eligibility/check` | **zintegrowane** — zasiłek macierzyński (urlop macierzyński) |
| POST | `/api/v1/eligibility/evaluate` | hub UX — nadal **mock** (BE nie udostępnia pełnego katalogu) |
| POST | `/api/v1/calculations/parental` | mock / przyszły REST |
| POST | `/api/v1/documents/analyze` | mock / przyszły REST |
| GET | `/api/v1/knowledge` | mock / przyszły REST |

## POST `/api/v1/eligibility/check`

Request (`MaternityLeaveEligibilityRequest`):

- `children_count` (wymagane)
- `insured_at_birth`: `true` \| `false` \| `null` / pominięte (`null` ≠ „nie”)
- `insurance_title`: `umowa_o_prace` \| `zlecenie` \| `dzialalnosc_gospodarcza` \| `inny`
- `debt_amount_zl` (opcjonalnie, działalność)
- `employment_ended_reason` (gdy `insured_at_birth=false`)

Response (`EligibilityResult`): `status`, warunki, `missing_data`, `possible_solutions`, `plan` (nullable), `warnings`, `rules_version`.

**Status i plan są niezależne** — FE pokazuje plan warunkowy przy `requires_verification` + `plan` + `missing_data`.

Nie parsować `warnings` / `deadlines` jako logiki sterującej.
