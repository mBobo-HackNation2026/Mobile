# ETAP 12 — Inteligentny Plan Rodzica

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**Werdykt:** **GOTOWE** (z warunkiem BE dotyczącym `missing_fields`)

---

## 1. Podsumowanie zmian

1. Zabezpieczono i zacommitowano widok `review` + audyt Etapu 11 (`7dd6ecb`).
2. Wprowadzono wspólny hook `useCatalogEligibility` (cache TanStack Query dla katalogu 9).
3. Podłączono `/home` do wyników FastAPI eligibility (nie wyłącznie DEMO).
4. Dodano `/complete-data` — uzupełnianie odpowiedzi + ponowna ocena katalogu.
5. Prefetch oceny po zakończeniu ankiety; przekierowanie na `/home`.
6. Zachowano lokalny `buildParentPlan` jako **wyraźnie oznaczone DEMO**.
7. Nie parsowano heurystycznie `missing_data: string[]`.

---

## 2. Schemat przepływu

```
Ankieta → completeOnboarding → prefetchCatalogEligibility (9× check)
       → /home (MyPlan)
            ├─ useCatalogEligibility → CatalogEligibilityAdapter
            ├─ możliwości / co teraz / formalności API
            └─ wskazówki lokalne DEMO (buildParentPlan)
       → /complete-data → setProfile → invalidate + fetchQuery
       → zaktualizowany /home + /benefits (wspólny cache)
       → /benefits/[id]/review (double-check + AI)
```

---

## 3. Model współdzielonego stanu

| Element | Implementacja |
|---|---|
| Klucz | `['eligibility', profile]` (`CATALOG_ELIGIBILITY_QUERY_KEY`) |
| Hook | `src/hooks/useCatalogEligibility.ts` |
| Konsumenty | `/home`, hub świadczeń, szczegóły, review, complete-data |
| Unieważnienie | zmiana profilu w kluczu + `invalidateQueries` |
| Częściowy sukces | `uncheckedBenefit` → `needs_review`, `engineStatus: null` |
| Błąd ≠ odmowa | UI: retry / „nie udało się sprawdzić” |

---

## 4. Źródła danych dashboardu

| Sekcja | Źródło |
|---|---|
| Twoja sytuacja | Profil ankiety (lokalny) |
| Twoje możliwości | **Eligibility API** (9 świadczeń) |
| Co teraz? | `pickDashboardFocus` z evaluation / missing / formalities |
| Najbliższe formalności | Checklist/terminy z `evaluate` (plany silnika) |
| Szybkie działania | Nawigacja |
| Wskazówki lokalne | `buildParentPlan` — **DEMO** |

---

## 5. Uzupełnianie informacji

- Trasa: `/complete-data`
- Wejścia: Plan, hub (banner braków), szybkie działania, review
- Pokazuje surowe komunikaty `missing_data` (bez zgadywania pól)
- Edycja jawnych pól profilu: `ProfileAnswersReview`
- Po zapisie: pełna ponowna ocena katalogu 9

---

## 6. Pola możliwe do uzupełnienia (UX)

Z `ProfileAnswersReview` / ankiety:

- ubezpieczenie, zatrudnienie, zadłużenie DG  
- liczba dzieci, wiek dziecka (miesiące)  
- drugi rodzic ubezpieczony  
- Za życiem, pełny wymiar 21 dni  
- dni ciągłego ubezpieczenia  
- tygodnie urlopu drugiego rodzica  

---

## 7. Ograniczenia `missing_data: string[]`

- Brak stabilnych ID pól — FE **nie** mapuje tekstów na formularz automatycznie.
- Użytkownik widzi komunikaty i może edytować znane pola albo pełną ankietę.
- **Do kompletnej nawigacji „brak → pole” potrzeba BE `missing_fields`.**

---

## 8. Wyniki S1–S3 (live / UI)

Live katalog (Etap 11 + smoke Etap 12 na profilu po narodzinach w sesji UI):

| Scenariusz | Ocenione | Typowy wynik UI Plan |
|---|---|---|
| S2 (po narodzinach, UoP) — live UI | **9** | 2× „Może przysługiwać”, 7× „więcej informacji”; focus → Uzupełnij dane |
| S1/S3 | Zgodne z Etap 11 (API 200×9) | Te same mechanizmy FE |

Po uzupełnieniu danych: invalidate + `fetchQuery` na nowym profilu → Plan i lista korzystają z tego samego cache.

---

## 9. Odświeżanie wyników

| Zdarzenie | Efekt |
|---|---|
| Koniec ankiety | Prefetch 9 + `/home` |
| Zmiana profilu (complete-data / review) | Invalidate + nowa ocena |
| AI explain | Czyszczone przy `profileKey` / benefit |

---

## 10. Błędy / częściowa niedostępność

- Pełny błąd katalogu → komunikat + retry (nie `not_eligible`).
- Częściowy fail jednego kodu → `unchecked` w licznikach.
- DEMO nie zastępuje oceny przy błędzie API.

---

## 11. Zrzuty

- `docs/etap11-screenshots/etap11-moj-plan.png` — **przed** (tylko DEMO)  
- `docs/etap12-screenshots/etap12-moj-plan-eligibility.png` — **po** (FastAPI + liczniki + focus)

---

## 12. Zmienione / nowe pliki

- `src/hooks/useCatalogEligibility.ts` *(nowy)*
- `src/features/plan/eligibilityDashboard.ts` *(nowy)*
- `src/features/plan/MyPlanScreen.tsx`
- `src/features/profile/CompleteDataScreen.tsx` *(nowy)*
- `src/app/(main)/complete-data.tsx` *(nowy)*
- `src/features/benefits/BenefitsHubScreen.tsx`
- `src/features/benefits/BenefitDetailScreen.tsx`
- `src/features/benefits/BenefitAssessmentReviewScreen.tsx`
- `src/features/onboarding/OnboardingWizard.tsx`
- `scripts/regression-eligibility-dashboard.ts`
- `package.json` (`test:regression`)
- `ETAP12_INTELIGENTNY_PLAN_RODZICA.md`

(Review zachowany z `7dd6ecb`.)

---

## 13. Testy automatyczne

| Komenda | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS (+ dashboard) |
| `npm run export:web` | PASS |

---

## 14. Problemy wymagające backendu

1. **`missing_fields: string[]`** (lub bogatsza struktura z `benefit_code`) — stabilne ID pól.  
2. Opcjonalnie: priorytet braków per świadczenie.  
3. Bez tego FE nie może bezpiecznie prowadzić „brak → konkretne pytanie” wyłącznie z tekstów PL.

---

## 15. Commity / HEAD

| Commit | Opis |
|---|---|
| `1f94698` | Inteligentny Plan + complete-data + shared eligibility |
| `7dd6ecb` | Review flow + Etap 11 audit (zabezpieczenie) |
| `fa0f086` | Bazowy przed Etapem 12 |

**HEAD:** `1f94698`

---

## Odpowiedzi obowiązkowe

1. **Czy „Mój Plan” korzysta już z rzeczywistych wyników silnika eligibility?**  
   **Tak** — liczniki, focus i formalności z `evaluate()`; DEMO jest osobną, oznaczoną sekcją.

2. **Czy po zmianie danych wyniki są aktualizowane?**  
   **Tak** — invalidate + ponowna ocena katalogu; wspólny cache Plan/Hub/szczegóły.

3. **Czy użytkownik może uzupełniać brakujące informacje?**  
   **Tak** — `/complete-data` + review + ankieta; bez automatycznego mapowania tekstów `missing_data` na pola.

4. **Które braki nadal nie mają pytań w formularzu?**  
   m.in. triad rehabilitacyjna, `gestational_week_at_birth`, `birth_weight_grams`, `postpartum_weeks_elapsed`, `voluntary_contribution_base_zl`, `bonus_type`, `months_since_last_benefit`, `school_obligation_deferred`, `days_since_death` (poza częściowym pokryciem w ankiecie/review).

5. **Czy potrzebujemy `missing_fields` z BE?**  
   **Tak** — do kompletnego, bezpiecznego powiązania braków z polami formularza.

### Werdykt: **GOTOWE**

Kryteria FE Etapu 12 spełnione w testach live UI + typecheck/regression/export. Pełna automatyczna nawigacja „każdy brak → pole” pozostaje zależna od kontraktu BE — jawnie nie deklarowana jako ukończona.
