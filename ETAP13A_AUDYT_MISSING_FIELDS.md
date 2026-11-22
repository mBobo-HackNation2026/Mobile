# ETAP 13A — Audyt `missing_fields` i automatycznego uzupełniania danych

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**HEAD:** `b9d00ec`  
**Working tree:** czysty (brak niezacommitowanych zmian przed audytem)  
**Backend live:** `EXPO_PUBLIC_API_BASE_URL` (ngrok) · health OK · version `0.1.0`  
**Charakter etapu:** audyt diagnostyczny — **bez zmian implementacyjnych FE/BE**

---

## 1. Czy backend udostępnia ustrukturyzowane braki?

# **TAK**

| Element | Wartość |
|---|---|
| Nazwa pola | **`missing_fields`** |
| Typ | `MissingFieldInfo[]` |
| Dokumentacja OpenAPI | **Tak** — `components.schemas.EligibilityResult` + `MissingFieldInfo` |
| Wymagane w `required` | **Nie** (opcjonalne uzupełnienie; `missing_data` pozostaje wymagane) |
| Live odpowiedzi | **Tak** — pole obecne w JSON HTTP 200 |

### Struktura `MissingFieldInfo` (OpenAPI)

```json
{
  "field": "za_zyciem_certificate",
  "message": "informacja o zaświadczeniu 'Za życiem'"
}
```

- `field` (string, required) — dokładna nazwa pola z `MaternityLeaveEligibilityRequest`
- `message` (string, required) — ten sam tekst co odpowiadający wpis w `missing_data`

Opis OpenAPI wprost: FE może mapować na kontrolkę formularza **bez** heurystycznego parsowania polskiego tekstu. `missing_data` zostaje dla kompatybilności wstecznej. Liczba wpisów `missing_fields` może być **większa** niż `missing_data`, gdy jeden komunikat dotyczy wielu pól (ta sama `message` powtórzona).

Inne nazwy (`missing_field_codes`, `missing_data_details`): **nie występują** w OpenAPI.

---

## 2. Potwierdzenie OpenAPI

Źródło: `GET /openapi.json` (HTTP 200).

`EligibilityResult.properties` zawiera m.in.:

`benefit_code`, `benefit_name`, `status`, `met_conditions`, `unmet_conditions`, **`missing_data`**, **`missing_fields`**, `possible_solutions`, `plan`, `rules_version`, `data_source`, `warnings`.

---

## 3. Przykładowe rzeczywiste odpowiedzi (live)

### Urlop ojcowski (S1 — ciąża, bez `child_age_months`)

```json
{
  "status": "requires_verification",
  "missing_data": ["wiek dziecka w miesiącach"],
  "missing_fields": [
    { "field": "child_age_months", "message": "wiek dziecka w miesiącach" }
  ]
}
```

### Urlop rodzicielski (S2 — po narodzinach)

```json
{
  "status": "requires_verification",
  "missing_data": [
    "informacja o zaświadczeniu 'Za życiem'",
    "liczba tygodni urlopu rodzicielskiego już wykorzystanych przez drugiego rodzica"
  ],
  "missing_fields": [
    { "field": "za_zyciem_certificate", "message": "informacja o zaświadczeniu 'Za życiem'" },
    { "field": "other_parent_used_parental_leave_weeks", "message": "…" }
  ]
}
```

### Uzupełniający urlop macierzyński — `mf > md`

`missing_data.length === 3`, `missing_fields.length === 4`  
Pola: `child_hospitalization_weeks`, `gestational_week_at_birth`, `birth_weight_grams`, `postpartum_weeks_elapsed` — zgodne z opisem OpenAPI (jeden komunikat → wiele pól).

### Ponowna ocena po uzupełnieniu (S2 → rodzicielski)

Payload uzupełniony o:

- `za_zyciem_certificate: false`
- `other_parent_used_parental_leave_weeks: 0`

Wynik:

```json
{ "status": "likely_eligible", "missing_data": [], "missing_fields": [] }
```

Identyfikatory **znikają** po wypełnieniu; `false`/`0` **nie** są mylone z `null`.

---

## 4. Wyniki testów S1–S3 (27 ocen + recheck)

Wszystkie wywołania: **HTTP 200**.

### S1 — Ciąża, UoP

| Świadczenie | Status | md | mf | Pola `missing_fields` |
|---|---|---|---|---|
| macierzyński | likely_eligible | 0 | 0 | — |
| zasiłek w wys. mac. | requires_verification | 0 | 0 | — *(RV bez braków pól)* |
| urlop ojcowski | requires_verification | 1 | 1 | `child_age_months` |
| urlop rodzicielski | requires_verification | 3 | 3 | `za_zyciem_certificate`, `other_parent_used_parental_leave_weeks`, `full_dose_claimed_within_21_days` |
| chorobowy w ciąży | requires_verification | 1 | 1 | `insured_days_continuous` |
| rehabilitacyjne | requires_verification | 3 | 3 | `sickness_benefit_period_exhausted`, `medical_prognosis_recovery_possible`, `excluded_from_rehabilitation_benefit` |
| uzupełniający | requires_verification | 3 | 4 | hospitalizacja / tydzień ciąży / masa / tygodnie po porodzie |
| na warunkach mac. | requires_verification | 1 | 1 | `is_adoption_or_foster_care` |
| pogrzebowy | requires_verification | 2 | 2 | `is_stillbirth_or_infant_death`, `days_since_burial` |

### S2 — Po narodzinach

Jak S1, z różnicami: ojcowski → `likely_eligible`; rodzicielski → 2 braki (`za_zyciem`, `other_parent_used…`).

### S3 — DG

Macierzyński + chorobowy w ciąży → `likely_eligible`; pozostałe wzorzec jak S1 (ojcowski z `child_age_months`).

**Razem:** 27 ocen początkowych + 1 recheck rodzicielskiego po uzupełnieniu.

---

## 5. Pokrycie i jakość identyfikatorów

| Kryterium | Ocena |
|---|---|
| Stabilne nazwy techniczne | **Tak** — nazwy pól requestu |
| Zgodność z `MaternityLeaveEligibilityRequest` | **Tak** (sprawdzone próbki) |
| Generowane przez AI? | **Nie** — OpenAPI/silnik deterministyczny |
| Zależność od świadczenia | **Tak** — różne zestawy pól |
| Tylko rzeczywiste braki | **Tak** przy `md>0`; znikają po uzupełnieniu |
| `false`/`0` vs `null` | **OK** (recheck) |
| Każdy `requires_verification` ma `missing_fields`? | **Nie** — np. `zasilek_w_wysokosci_zasilku_macierzynskiego` ma RV z `md=0`/`mf=0` |

**Wniosek jakości:** gdy są braki danych, identyfikatory są poprawne i użyteczne. Nie każde `requires_verification` wynika z brakujących pól formularza (ostrzeżenia / ostrożna ścieżka).

---

## 6. Mapa identyfikatorów → FE (stan obecny)

| `field` (API) | W ankiecie / ProfileAnswersReview? | Uwagi |
|---|---|---|
| `child_age_months` | Tak (oba) | |
| `za_zyciem_certificate` | Tak | |
| `other_parent_used_parental_leave_weeks` | Review tak / ankieta nie | |
| `full_dose_claimed_within_21_days` | Tak | |
| `insured_days_continuous` | Review tak / ankieta nie | |
| `sickness_benefit_period_exhausted` | **Nie** | |
| `medical_prognosis_recovery_possible` | **Nie** | |
| `excluded_from_rehabilitation_benefit` | **Nie** | |
| `child_hospitalization_weeks` | Ankieta tak / Review nie | |
| `gestational_week_at_birth` | **Nie** | |
| `birth_weight_grams` | **Nie** | |
| `postpartum_weeks_elapsed` | **Nie** | |
| `is_adoption_or_foster_care` | Częściowo (etap) | |
| `is_stillbirth_or_infant_death` | Częściowo (okoliczności) | |
| `days_since_burial` | Ankieta tak / Review nie | |

---

## 7. Stan frontendu

| Pytanie | Odpowiedź |
|---|---|
| 1. Czy FE odczytuje `missing_fields`? | **Nie** |
| 2. Czy `/complete-data` dobiera pytania po kodach? | **Nie** — stały formularz + lista tekstów `missing_data` |
| 3. Mapowanie po stabilnych kodach? | **Nie** |
| 4. Zapis do profilu? | **Tak** — znane pola w `ProfileAnswersReview` / ankieta |
| 5. Ponowna ocena po zapisie? | **Tak** — invalidate + `fetchQuery` katalogu 9 |
| 6. Aktualizacja Plan / lista? | **Tak** — wspólny cache `useCatalogEligibility` |
| 7. Pola API bez UI? | **Tak** — m.in. triad rehabilitacyjna, wcześniactwo/masa, postpartum |

### Mechanizm utraty danych w FE

`eligibilityResultSchema` w `src/services/api/eligibilityCheckSchemas.ts` **nie zawiera** `missing_fields`.  
Zod domyślnie **usuwa** nieznane klucze — potwierdzono lokalnie: po `parse` pole znika (`missing_fields in parsed === false`).

`CatalogEligibilityAdapter` zbiera tylko `missing_data` → `missingInputs`.

### Pliki przepływu

- `eligibilityCheckSchemas.ts` — schema (brak `missing_fields`)
- `CatalogEligibilityAdapter.ts` — agregacja `missing_data`
- `mapEligibilityCheckToBenefit.ts` — warunki z tekstów
- `CompleteDataScreen.tsx` — UI uzupełniania
- `ProfileAnswersReview.tsx` — stały zestaw pól
- `useCatalogEligibility.ts` / `MyPlanScreen.tsx` — plan i re-eval

---

## 8. Braki integracji FE (kolejny etap)

1. Dodać `missing_fields` do Zod / typów FE (passthrough lub jawny schema).  
2. Agregować unikalne `field` w stanie katalogu.  
3. W `/complete-data` renderować pytania **tylko** dla znanych `field` (mapa kontrolka ↔ `ParentProfile`).  
4. Dodać kontrolki dla pól jeszcze nieobsługiwanych.  
5. Nie parsować `message` heurystycznie.  
6. Obsłużyć RV bez `missing_fields` (ostrzeżenia / weryfikacja instytucjonalna).

---

## 9. Potencjalne problemy kontraktu BE

1. `missing_fields` nie jest w `required` — starsze klienty OK, nowe muszą tolerować brak.  
2. Nie każdy `requires_verification` ma braki pól — FE nie powinien zakładać, że zawsze będzie formularz.  
3. `mf.length > md.length` — UI musi deduplikować pytania po `field`, nie po `message`.  
4. Brak osobnego `benefit_code` wewnątrz `MissingFieldInfo` — FE musi łączyć z kontekstem świadczenia samodzielnie (przy agregacji katalogu).

---

## 10. Bezpieczeństwo / spójność (P1)

| Temat | Stan |
|---|---|
| `null` vs `false` | BE i mapowanie FE zachowują rozróżnienie; recheck OK |
| Puste ≠ `0` | FE: puste stringi → null |
| Unieważnienie po profilu | Tak (Etap 12) |
| Race AI | Guard Etap 10 |
| Błąd API ≠ not_eligible | Tak (`uncheckedBenefit`) |
| MockZUS jako deklaracja | Nie — deklaracja z profilu |

---

## 11. Testy techniczne

| Komenda | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS |
| `npm run export:web` | PASS |
| Live OpenAPI + 27× eligibility + 1 recheck | PASS |

---

## 12. Commity / HEAD

| Ref | Opis |
|---|---|
| **HEAD** | `b9d00ec` — docs Etap 12 |
| | `1f94698` — Inteligentny Plan |
| | `7dd6ecb` — review + Etap 11 |

Ten etap: tylko plik raportu `ETAP13A_AUDYT_MISSING_FIELDS.md` (bez zmian logiki).

---

## Werdykt końcowy

# **A. GOTOWE DO INTEGRACJI**

Backend **zwraca stabilne** `missing_fields: { field, message }[]` zgodne z OpenAPI i z polami requestu.  
Frontend **jeszcze ich nie odczytuje** (schema Zod je usuwa) i `/complete-data` nie dobiera pytań automatycznie po kodach.

### Odpowiedź na kluczowe pytanie

**Czy eBobo ma już wszystkie dane techniczne, żeby automatycznie zadawać rodzicowi tylko pytania, których brakuje silnikowi?**

**Po stronie backendu: tak** (dla reguł, które zwracają braki pól).  
**Po stronie produktu end-to-end: jeszcze nie** — brakuje integracji FE (parsowanie + mapa kontrolek + brakujące UI dla części pól). Dodatkowo część `requires_verification` nie ma `missing_fields` i wymaga innego UX (weryfikacja / ostrzeżenia), nie formularza.

### Rekomendacja kolejnego kroku (Etap 13B)

1. Rozszerzyć `eligibilityResultSchema` o `missing_fields`.  
2. Przekazać je przez adapter do `/complete-data`.  
3. Render pytań po `field` + rozszerzenie formularza o brakujące kontrolki.  
4. Regresja: uzupełnienie pola → zniknięcie z `missing_fields` → odświeżenie Plan/Hub.
