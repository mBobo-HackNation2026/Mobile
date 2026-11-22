# ETAP 11 — Audyt ankiety i kompletności oceny świadczeń

**Data:** 2026-11-22  
**Gałąź:** `feature/ebobo-frontend-mvp`  
**HEAD (ostatni commit):** `fa0f086`  
**Working tree:** niezacommitowane zmiany widoku `/benefits/[id]/review` (Etap „szczegóły oceny”) — nie wpływają na wniosek o 9 świadczeniach w `CatalogEligibilityAdapter`.  
**Tryb API:** `EXPO_PUBLIC_API_MODE=rest` (live FastAPI przez ngrok)  
**Werdykt:** **CZĘŚCIOWA INTEGRACJA**

---

## 1. Werdykt

| Obszar | Ocena |
|---|---|
| Jedna ankieta → zapis profilu | Działa |
| Automatyczna ocena **wszystkich 9** świadczeń po wejściu w listę | Działa (`CatalogEligibilityAdapter`) |
| Prezentacja statusów / braków na liście świadczeń | Działa |
| Rozróżnienie błąd API ≠ `not_eligible` | Działa (`uncheckedBenefit` → `needs_review`) |
| Mój Plan spersonalizowany wynikami silnika | **Nie** — lokalny `buildParentPlan` DEMO |
| Kompletne zbieranie pól potrzebnych silnikowi | Częściowe — wiele pól nie w ankiecie |
| Mapowanie `missing_data` → konkretne pola formularza | **Brak** (tylko teksty) |
| Sprawy / checklista | Hybryda: API formalities + lokalne DEMO |

**Nie deklarujemy pełnej integracji.** Katalog 9 świadczeń jest oceniany przez FastAPI, ale dashboard „Mój Plan” nie jest napędzany wynikami eligibility, a ankieta nie zbiera wszystkich pól wymaganych do domknięcia wielu ocen.

---

## 2. Schemat rzeczywistego przepływu danych

```
Welcome / Demo
    → OnboardingWizard (schema + RHF)
    → completeOnboarding → Zustand ParentProfile
       (persist: AsyncStorage „ebobo-user-journey”)
    → router.push('/benefits')
    → BenefitsHubScreen
         useQuery(['eligibility', profile])
         → CatalogEligibilityAdapter.evaluate(profile)
            → profileToEligibilityCheckRequest(profile)
            → Promise.allSettled( 9 × POST /eligibility/check/{code} )
            → mapEligibilityCheckToBenefit × N
            → deriveFormalitiesFromBenefits
         → UI: grupy A–E + banner missingInputs

Mój Plan (/home)
    → buildParentPlan(profile, overrides)   ← TYLKO lokalne DEMO
    → NIE wywołuje eligibilityService.evaluate

Moje sprawy /plan /kalendarz
    → evaluate() + buildParentPlan → mergeChecklists / mergeDeadlines

Review /benefits/[id]/review (working tree)
    → evaluate() + opcjonalnie 1× checkBenefitEligibility(id)
    → invalidateQueries(['eligibility'])
```

### Pliki kluczowe

| Krok | Plik | Stan / źródło |
|---|---|---|
| Ankieta | `src/features/onboarding/OnboardingWizard.tsx`, `schema.ts` | Lokalny formularz |
| Zapis | `src/store/useUserJourneyStore.ts` | Lokalny Zustand + persist |
| Mapowanie API | `src/services/api/eligibilityCheck.ts` | `profileToEligibilityCheckRequest` |
| Ocena 9 | `src/services/api/CatalogEligibilityAdapter.ts` | Live REST |
| Lista | `src/features/benefits/BenefitsHubScreen.tsx` | Wynik query |
| Mój Plan | `src/features/plan/MyPlanScreen.tsx` + `buildParentPlan.ts` | **DEMO lokalne** |
| Sprawy | `src/app/(main)/sprawy.tsx` | Merge API + DEMO |

**Wniosek:** Lokalny plan demonstracyjny **nie** jest odpowiednikiem pełnej oceny backendowej. Aplikacja sama to komunikuje banerem na `/home`.

---

## 3. Mapa pól onboarding → request API

Legenda:  
**OK** = zbierane i wysyłane · **Część** = w profilu/mapperze, rzadko w ankiecie · **Brak UX** = nie zbierane · **Kalkulator** = tylko kalkulator

| Pole backendu | Czy zbierane? | Ekran/pytanie | Gdzie zapisane? | Czy wysyłane? | Uwagi |
|---|---|---|---|---|---|
| `children_count` | OK | Ankieta (rodzina) | Zustand | Tak (min 1) | Wymagane |
| `is_pregnant` | Część | Etap → inferencja | stage / isPregnant | Tak | pregnancy→true; after_birth→false |
| `insured_at_birth` | OK | Ubezpieczenie | insuranceStatus | Tak | unknown→`null` (nie false) |
| `father_insured` | OK | Engine step | Zustand | Tak (tri→null) | |
| `insurance_title` | OK | Forma zatrudnienia | employmentType | Tak (mapowanie) | |
| `is_full_time_employment` | OK | Engine step | Zustand | Tak | |
| `is_adoption_or_foster_care` | Część | Etap adoption/foster | stage | Tak (inferencja) | |
| `insured_days_continuous` | Brak UX* | Review (opcjonalnie) | profil | Tak jeśli ustawione | *nie w onboarding schema |
| `employment_ended_reason` | OK | Gdy brak ubezp. | Zustand | Tak warunkowo | |
| `employment_duration_months` | Brak UX | — | profil null | null | |
| `debt_amount_zl` | OK | DG | Zustand | Tak dla DG | puste≠0 |
| `other_employment_secured` | OK | Engine | Zustand | Tak | |
| `voluntary_contribution_base_zl` | Brak UX | — | — | **Nigdy z profilu** | Luka |
| `child_age_months` | OK | Po porodzie / engine | Zustand | Tak | |
| `child_age_years` | Brak UX | — | null | null | |
| `gestational_week_at_birth` | Brak UX | — | null | null | Często w missing_data |
| `birth_weight_grams` | Brak UX | — | null | null | |
| `child_hospitalization_weeks` | OK | Engine (opcjonalnie) | Zustand | Tak | |
| `postpartum_weeks_elapsed` | Brak UX | — | null | null | |
| `is_stillbirth_or_infant_death` | Część | Okoliczności | specialCircumstances | Tak | |
| `za_zyciem_certificate` | OK | Engine | Zustand | Tak | Często missing |
| `foster_care_type` | Część | Etap | inferencja | Tak | |
| `school_obligation_deferred` | Brak UX | — | null | null | |
| `sickness_benefit_period_exhausted` | Brak UX | — | null | null | Rehabilitacyjne |
| `medical_prognosis_recovery_possible` | Brak UX | — | null | null | |
| `excluded_from_rehabilitation_benefit` | Brak UX | — | null | null | |
| `days_since_death` | Brak UX | — | null | null | |
| `days_since_burial` | OK | Okoliczności wrażliwe | Zustand | Tak | |
| `average_monthly_income_zl` | Kalkulator | Kalkulator | lokalnie w calc | Tylko calc | |
| `bonus_type` | Brak UX | — | — | **Nigdy z profilu** | |
| `full_dose_claimed_within_21_days` | OK | Engine | Zustand | Tak | |
| `other_parent_used_parental_leave_weeks` | Brak UX* | Review | profil | Tak jeśli | *nie w ankiecie |
| `part_time_fraction_during_parental_leave` | Brak UX | — | null | null | |
| `months_since_last_benefit` | Brak UX | — | — | **Nigdy z profilu** | |

### `null` vs `false`

- `triStateToBool('unknown')` → `null` (`schema.ts`).
- `insuranceStatus: unknown` → `insured_at_birth: null`.
- `serializeEligibilityCheckRequest` zachowuje jawne `null`, pomija `undefined`.
- Puste stringi liczbowe → `null`, nie `0` (onboarding).
- **Nie** ustawiamy sztucznych wartości tylko po to, by wymusić `likely_eligible`.

Pola zbierane, ale **nie** wysyłane do eligibility: `role`, `eventDate`, `hasSecondParent` (używane lokalnie w planie DEMO).

---

## 4. Tabela 9 świadczeń — czy FE je ocenia?

`CatalogEligibilityAdapter` wywołuje **wszystkie** kody z `BENEFIT_CODES` równolegle przy `evaluate()`, gdy montuje się ekran z `useQuery(['eligibility', profile])` (po onboardingu → `/benefits`).

| Świadczenie | Czy FE wysyła request po ankiecie? | Gdzie wynik? |
|---|---|---|
| `zasilek_macierzynski_urlop_macierzynski` | Tak | Lista + szczegóły |
| `zasilek_w_wysokosci_zasilku_macierzynskiego` | Tak | Lista (często ostrożnie → needs_review) |
| `urlop_ojcowski` | Tak | Lista |
| `urlop_rodzicielski` | Tak | Lista |
| `zasilek_chorobowy_w_ciazy` | Tak | Lista |
| `swiadczenie_rehabilitacyjne` | Tak | Lista |
| `uzupelniajacy_urlop_macierzynski` | Tak | Lista |
| `urlop_na_warunkach_urlopu_macierzynskiego` | Tak | Lista |
| `zasilek_pogrzebowy_martwe_urodzenie` | Tak | Lista |

**Nie** jest to job przy samym `completeOnboarding` — triggerem jest montaż konsumenta query (hub świadczeń).  
**Nie** uruchamia tego sam `/home`.

Przy częściowym błędzie sieci: `uncheckedBenefit` ze statusem UI `needs_review` (nie `not_eligible`).

---

## 5. Wyniki live S1–S3 (FastAPI, 2026-11-22)

Health: HTTP 200. Wszystkie requesty: HTTP 200.  
Payloady odpowiadają mapowaniu demo profili (bez PII).

### S1 — Ciąża, umowa o pracę

| Świadczenie | Request? | Status API | Status w UI (mapowanie) | Zgodne? |
|---|---|---|---|---|
| macierzyński | Tak | `likely_eligible` | `likely_eligible` | Tak |
| zasiłek w wys. macierzyńskiego | Tak | `requires_verification` | zwykle `needs_review` / ostrożny | Tak* |
| urlop ojcowski | Tak | `requires_verification` (+ wiek dziecka) | `insufficient_data` | Tak |
| urlop rodzicielski | Tak | `requires_verification` (+ Za życiem, tygodnie) | `insufficient_data` | Tak |
| chorobowy w ciąży | Tak | `requires_verification` (+ dni ubezp.) | `insufficient_data` | Tak |
| rehabilitacyjne | Tak | `requires_verification` | `insufficient_data` | Tak |
| uzupełniający macierzyński | Tak | `requires_verification` | `insufficient_data` | Tak |
| na warunkach macierzyńskiego | Tak | `requires_verification` | `insufficient_data` | Tak |
| pogrzebowy / martwe urodzenie | Tak | `requires_verification` | `insufficient_data` | Tak |

\*UI może obniżyć `likely_eligible` art. 30 do `needs_review` (`isCautiousEligibilityResult`).

### S2 — Po narodzinach (1 miesiąc, UoP)

| Świadczenie | Request? | Status API | Status w UI | Zgodne? |
|---|---|---|---|---|
| macierzyński | Tak | `likely_eligible` | `likely_eligible` | Tak |
| zasiłek w wys. mac. | Tak | `requires_verification` | needs_review* | Tak |
| urlop ojcowski | Tak | `likely_eligible` | `likely_eligible` | Tak |
| urlop rodzicielski | Tak | `requires_verification` | `insufficient_data` | Tak |
| chorobowy w ciąży | Tak | `requires_verification` | `insufficient_data` | Tak |
| rehabilitacyjne | Tak | `requires_verification` | `insufficient_data` | Tak |
| uzupełniający | Tak | `requires_verification` | `insufficient_data` | Tak |
| na warunkach | Tak | `requires_verification` | `insufficient_data` | Tak |
| pogrzebowy | Tak | `requires_verification` | `insufficient_data` | Tak |

### S3 — Działalność gospodarcza (ciąża, 180 dni, dług 0)

| Świadczenie | Request? | Status API | Status w UI | Zgodne? |
|---|---|---|---|---|
| macierzyński | Tak | `likely_eligible` | `likely_eligible` (+ warning Z-3b/ZAM) | Tak |
| zasiłek w wys. mac. | Tak | `requires_verification` | needs_review* | Tak |
| urlop ojcowski | Tak | `requires_verification` | `insufficient_data` | Tak |
| urlop rodzicielski | Tak | `requires_verification` | `insufficient_data` | Tak |
| chorobowy w ciąży | Tak | `likely_eligible` | `likely_eligible` | Tak |
| rehabilitacyjne | Tak | `requires_verification` | `insufficient_data` | Tak |
| uzupełniający | Tak | `requires_verification` | `insufficient_data` | Tak |
| na warunkach | Tak | `requires_verification` | `insufficient_data` | Tak |
| pogrzebowy | Tak | `requires_verification` | `insufficient_data` | Tak |

Dashboard S2 w UI pokazywał „Dziecko już się urodziło / ~1 miesiąc” — spójne z profilem, ale zadania planu pochodzą z **DEMO**, nie z powyższych statusów API.

---

## 6. Analiza `missing_data`

| Pytanie | Wynik |
|---|---|
| Czy FE pokazuje? | Tak — banner hubu (`missingInputs`), warunki `unknown`, review, explain AI |
| Język? | Surowy tekst z BE (czasem długi, techniczny) |
| Uzupełnienie? | CTA „Uzupełnij ankietę” / ProfileAnswersReview / review |
| Mapowanie na pola? | **Nie** — brak `missing_fields`; brak parsowania ID |
| AI? | Wyjaśnia braki, nie zastępuje pól |
| Ponowna ocena? | Tak — zmiana profilu zmienia `queryKey`; review woła `check` + invalidate |

**Ryzyko:** polegamy na treści stringów BE. Zmiana copy w silniku złamie ewentualne przyszłe heurystyki.  
**Propozycja BE (bez implementacji):** dodać `missing_fields: string[]` (stabilne identyfikatory, np. `za_zyciem_certificate`).

---

## 7. Aktualizacja po zmianie profilu

| Scenariusz | Zachowanie |
|---|---|
| Koniec onboardingu | Profil zapisany → `/benefits` → evaluate 9 |
| Zmiana zatrudnienia / ubezp. | Nowy obiekt w `queryKey` → refetch na zamontowanych ekranach |
| Lista świadczeń | Aktualizuje się po refetch |
| Dashboard `/home` | Przelicza **lokalny** plan (bez API eligibility) |
| Checklista spraw | Merge lokalny + API po refetch evaluate |
| AI explain | Czyszczone przy zmianie `profileKey` / benefit |
| Race starej odpowiedzi | Guard w explain (Etap 10); eligibility przez TanStack Query |

Ponowna ocena **nie** leci na każdy keystroke — dopiero zapis profilu / invalidate / świadome „oceń ponownie”.

---

## 8. Źródła danych „Mój Plan”

| Element UI | Źródło | Klasa |
|---|---|---|
| „Twoja sytuacja” / etap | `buildParentPlan` z profilu | **C** lokalna logika |
| „Co teraz?” | Lokalne taski DEMO | **C/D** |
| Najbliższe terminy | Lokalne taski / okna | **C/D** |
| Postęp 0/N | Lokalna checklista | **C** |
| Baner | Jawnie: plan demonstracyjny | **D** |
| Statusy świadczeń na planie | **Brak** — odsyła do Świadczeń | — |
| CTA Sprawy / Świadczenia | Nawigacja | — |

**Sprawy (`/sprawy`):**  
**A** formalities z planów eligibility + **C** lokalne → `mergeChecklists` (preferuje API).

**Rozbieżność krytyczna do uniknięcia:** silnik `requires_verification` **nie** jest pokazywany na `/home` jako „potwierdzone” — plan w ogóle nie renderuje statusów eligibility. Ryzyko to raczej **fałszywe poczucie kompletnego planu**, nie fałszywy `likely_eligible`.

---

## 9. Backend vs DEMO — rozróżnienie

| Warstwa | `isDemo` / komunikat |
|---|---|
| `CatalogEligibilityAdapter` | `isDemo: false`, ostrzeżenie o osobnym planie DEMO |
| `buildParentPlan` | `isDemo: true` |
| Mock adapter | tylko gdy `API_MODE≠rest` |
| Baner `/home` | „lokalny plan demonstracyjny” |
| Baner świadczeń | „Ocena informacyjna — nie decyzja ZUS” |

---

## 10. Luki FE (do kolejnego etapu)

1. **`/home` nie konsumuje wyników eligibility** — największa luka produktu vs brief.  
2. Ankieta nie zbiera pól typowych dla rehabilitacyjnego, uzupełniającego, pogrzebowego, części rodzicielskiego.  
3. Brak mapowania `missing_data` → pola (wymaga lepszego kontraktu lub kontrolowanego słownika).  
4. Hub łączy wszystkie `missing_data` w jeden banner — mało czytelne.  
5. `voluntary_contribution_base_zl`, `bonus_type`, `months_since_last_benefit` niedostępne w UX.  
6. Ocena 9 nie startuje, jeśli użytkownik po ankiecie pójdzie tylko na Plan (edge case).

---

## 11. Potrzeby kontraktu BE (propozycja, bez implementacji)

- `missing_fields: string[]` — stabilne ID pól.  
- Ewentualnie `field_hints` / priorytet braków per benefit.  
- Bez zmian reguł prawnych w tym etapie.

---

## 12. Architektura docelowa (propozycja)

**Etap 1 — podstawowa ankieta**  
Minimum: etap, rola, zatrudnienie, ubezp., dzieci, drugi rodzic, kluczowe tri-state.

**Etap 2 — automatyczna analiza 9**  
Jak dziś: `evaluate()` → 9× check (ew. prefetch zaraz po `completeOnboarding`).

**Etap 3 — uzupełnienie braków**  
Pytania generowane z `missing_fields` / priorytetów API → zapis → re-evaluate.

**Etap 4 — spersonalizowany plan**  
„Co teraz?” z: `likely_eligible` + `plan` + formalities API + (opcjonalnie) lokalne taski medyczne jako warstwa DEMO jasno oznaczona.

---

## 13. Backlog P0 / P1 / P2

### P0
1. Podłączyć „Co teraz?” / terminy na `/home` do wyników eligibility + formalities (zachować baner DEMO tylko dla warstwy lokalnej).  
2. Prefetch `evaluate` zaraz po zakończeniu ankiety (nie tylko przy `/benefits`).  
3. Progressive disclosure: dopytać o top `missing_data` bez pełnej re-ankiety.  
4. Skrócić/grupować banner braków na hubie.

### P1
5. Pola: `insured_days_continuous`, `other_parent_used_parental_leave_weeks`, triad rehabilitacyjna, dane wcześniactwa.  
6. Współpraca BE: `missing_fields`.  
7. Spójność Sprawy ↔ Plan wyłącznie na źródłach A/B.

### P2
8. Dochód / `bonus_type` poza kalkulatorem tylko gdy potrzebne.  
9. Feedback nietypowych przypadków (gdy BE gotowe).

---

## 14. Wyniki testów

| Komenda | Wynik |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test:regression` | PASS |
| `npm run export:web` | PASS → `dist/` |
| Live health | 200 |
| Live 9×3 (S1–S3) | 27× HTTP 200 |

### Zrzuty

`docs/etap11-screenshots/`

- `etap11-benefits-list.png` — lista + banner braków  
- `etap11-moj-plan.png` — plan DEMO  

(Review `requires_verification` — ścieżka `/benefits/.../review` w working tree; UI weryfikowany wcześniej w sesji.)

---

## 15. Commity i HEAD

| Ref | Opis |
|---|---|
| **HEAD** | `fa0f086` — docs: Etap 10 commit hash |
| Poprzednie | `eb5cfd4` Etap 10 AI UX; `2375f21` / `8bd4b2f` AI; `eb82f17` Etap 9 |
| Ahead origin | 2 commity |
| Uncommitted | review screen + hub CTA „Sprawdź szczegóły” |

---

## Odpowiedź wprost

### Czy eBobo już teraz automatycznie identyfikuje wszystkie potencjalne świadczenia rodzica na podstawie jednej ankiety?

**Tak — w zakresie katalogu 9 świadczeń na ekranie „Moje świadczenia”.**  
Po zakończeniu ankiety (i wejściu w hub) frontend wywołuje FastAPI dla **wszystkich 9** kodów tym samym payloadem z profilu i pokazuje wyniki pogrupowane, w tym `requires_verification` / braki. Rodzic **nie** musi ręcznie odpalać każdego świadczenia.

**Jednocześnie: nie — w zakresie „kompletnego, spersonalizowanego przewodnika”.**  
Wiele ocen kończy się `requires_verification` przez niezbierane pola; `missing_data` nie mapuje się na formularz; a **„Mój Plan” nie jest zbudowany na wynikach silnika**, tylko na lokalnej logice DEMO. To jest **częściowa integracja**, nie pełna.

---

*Audyt diagnostyczny — bez zmian BE, bez przebudowy UX w tym etapie.*
