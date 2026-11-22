# ETAP 15 — Flow: Świadczenia → Kalkulator → Formalności → ZUS

**Data:** 2026-11-22  
**Baza Git przed pracą:** `8a723bc` (+ niezacommitowany Etap 14)  
**Werdykt etapu FE:** **GOTOWE** (integracja ścieżki + rejestr linków; BE formalities opcjonalne)

---

## 1. Zmiany w przepływie świadczeń

Docelowa ścieżka:

**Onboarding → Moje świadczenia → Szczegóły → Oblicz kwotę → Dokumenty/terminy → Oficjalna instytucja**

| Krok | Implementacja |
|---|---|
| Po onboardingu | `/benefits` (Etap 14 + zachowane) |
| Karta katalogu | Jedno CTA: „Zobacz szczegóły” / „Uzupełnij informacje” |
| Szczegóły | Sekcje 1–5 w `BenefitDetailScreen` |
| Review | CTA kalkulator + compare rodzicielski |
| Powrót z kalkulatora | `?from=benefit` → `/benefits/{code}` |

Kolejność sekcji w szczegółach:

1. Twój wynik (+ AI explain)  
2. Ile możesz otrzymać?  
3. Jak podzielić urlop? (tylko `urlop_rodzicielski`)  
4. Co należy przygotować?  
5. Gdzie załatwisz sprawę?  
6. Co dalej?

---

## 2. Integracja kalkulatora

- CTA z szczegółów: `/calculator?benefit={code}&from=benefit`
- Synchronizacja `benefit` z query (`useEffect`)
- Prefill wariantów z profilu (`zaZyciem`, `fullDose21`)
- Endpoint: `POST /api/v1/benefits/calculate/{benefit_code}` — bez lokalnych formuł
- Status-aware copy:
  - `likely_eligible` → „Oblicz wysokość świadczenia”
  - wymaga info → szacunek + „Uzupełnij informacje”
  - `not_eligible` → „Sprawdź symulację kwoty” (oddzielona od uprawnienia)
- Po wyniku: sekcja „Co możesz zrobić dalej?” (dokumenty / sprawy / powrót)
- Błąd calculate **nie** zmienia statusu eligibility

---

## 3. Porównanie wariantów

- CTA w szczegółach `urlop_rodzicielski`: „Porównaj warianty” → `?compare=1`
- Endpoint: `POST /api/v1/benefits/compare/urlop-rodzicielski`
- FE pokazuje ostrzeżenia BE; heurystyka `compareHasCalculationDefect` (Etap wcześniejszy) — bez lokalnego algorytmu 81,5% na 9 tyg.

---

## 4. Rejestr linków (9 świadczeń)

Plik: `src/features/benefits/officialLinks.ts`

Każdy wpis: `benefit_code`, tytuł, URL, instytucja, typ (`case_status` | `procedure` | `form` | `legal_information`), login, data weryfikacji, status.

| Kod | Linki (min.) | Uwagi |
|---|---|---|
| `zasilek_macierzynski_urlop_macierzynski` | eZUS, dokumenty, formularze ZAM | verified |
| `zasilek_w_wysokosci_zasilku_macierzynskiego` | eZUS, formularze, dokumenty | forms: needs_recheck |
| `urlop_ojcowski` | eZUS, dokumenty, PIP | verified |
| `urlop_rodzicielski` | eZUS, dokumenty, gov.pl | verified |
| `zasilek_chorobowy_w_ciazy` | eZUS, psz.zus.pl dokumenty | verified |
| `swiadczenie_rehabilitacyjne` | eZUS, formularze ZNp-7 | verified |
| `uzupelniajacy_urlop_macierzynski` | eZUS, dokumenty, formularze | verified |
| `urlop_na_warunkach_urlopu_macierzynskiego` | eZUS, dokumenty, PIP | verified |
| `zasilek_pogrzebowy_martwe_urodzenie` | info ZUS, eZUS, korespondencja | spokojny UI (`calm`) |

**eZUS entry (HTTP 200, 2026-11-22):**  
https://www.zus.pl/o-zus/kontakt/portal-ezus  

**Nie promujemy** bezpośredniego CTA do ZUR / ZAO / Z-3b (`mentionsRetiredForm` + ostrzeżenie w procedurze).

Allowlist hostów + `openExternalUrl` (HTTPS, web: nowa karta noopener, bez utm).

---

## 5. Rozróżnienie ZUS / pracodawca

`resolvePaymentChannel(profile, officeText)`:

| Sytuacja | Kanał UI |
|---|---|
| UoP | `zus_or_employer` — oba kanały |
| DG / cywilna | `zus` |
| Tekst procedury „pracodawca” / „ZUS” | odpowiednio |
| Niepewne | `unknown` — oba + wyjaśnienie |

eZUS **nie** jest deep-linkiem do konkretnej sprawy. mObywatel DEMO **nie** loguje do prawdziwego eZUS.

---

## 6. Formalities API

| Endpoint | Status FE |
|---|---|
| `GET /api/v1/formalities/{code}` | Client `formalities.ts` + graceful `unavailable` |
| `GET /api/v1/formalities/general` | j.w. |
| Fallback | `benefit.procedure` z eligibility (+ derive checklist) |

W tej sesji backend (ngrok) **timeout** — nie potwierdzono live obecności endpointu. UI nie tworzy fikcyjnej listy przy `plan: null`.

---

## 7. Zmienione / nowe pliki

**Nowe**

- `src/features/benefits/officialLinks.ts`
- `src/features/benefits/OfficialLinksSection.tsx`
- `src/lib/openExternalUrl.ts`
- `src/services/api/formalities.ts`
- `scripts/regression-official-links.ts`
- `scripts/regression-calculator-context.ts`
- `ETAP15_FLOW_LINKI_KALKULATOR.md`
- `HACKATHON_2026_FINAL_COMPLIANCE_AUDIT.md`

**Zmienione (m.in.)**

- `BenefitDetailScreen.tsx`, `BenefitAssessmentReviewScreen.tsx`, `BenefitsHubScreen.tsx`
- `CalculatorScreen.tsx`, `resolveBenefitInstitution.ts`
- `services/api/index.ts`, `CONTRACT.md`, `package.json`

(+ pliki Etapu 14 nadal niezacommitowane w working tree)

---

## 8. Wyniki testów

| Test | Wynik |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm run test:regression` | **PASS** (w tym official-links + calculator-context) |
| `npm run export:web` | **PASS** → `dist/` |
| Live S1–S8 vs FastAPI | **NIE WYKONANE** — API ngrok timeout |
| Screenshoty RWD 375–1440 | **NIE WYKONANE** w tej sesji |
| HEAD eZUS portal | **PASS** (treść portalu eZUS) |

---

## 9. Screenshoty

Brak nowych zrzutów w tej sesji (brak stabilnego live API do pełnego smoke UI). Export web OK.

---

## 10. Commity

| Stan | Hash / uwagi |
|---|---|
| HEAD przed Etap 15 | `8a723bc` |
| Etap 14 + 15 | **niezacommitowane** w working tree — commit na życzenie |

---

## Definition of Done (check)

- [x] Świadczenia = główny ekran po onboardingu  
- [x] Kalkulator z konkretnego świadczenia + `benefit_code`  
- [x] Dane profilu / brak ponownego pytania o ankietę  
- [x] Compare rodzicielski w kontekście  
- [x] Po kwocie → dokumenty / sprawy / powrót  
- [x] 9× oficjalne linki + eZUS vs pracodawca  
- [x] Bez promocji wycofanych formularzy  
- [x] typecheck / regression / export  
- [ ] Pełne S1–S8 live — wymaga działającego BE  
