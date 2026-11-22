# eBobo — paczka konkursowa (HackNation 2026)

**Nazwa:** eBobo — Zasiłkowy Przewodnik Przyszłego Rodzica  
**Wersja FE do oddania (po Etap 17):** zobacz `ETAP17_FRONTEND_RELEASE_READINESS.md` (HEAD)  
**Branch:** `feature/ebobo-frontend-mvp`

---

## 1. Obietnica produktu

Powiedz nam, jaka jest Twoja sytuacja — pokażemy, jakie świadczenia mogą Ci przysługiwać, ile możesz otrzymać, czego jeszcze brakuje i co zrobić dalej.

Ocena jest **informacyjna** i nie stanowi decyzji ZUS.

---

## 2. Co przetestować (jury)

1. Wejście jako gość → ankieta **lub** „Sprawdź przykładową sprawę” (`/sample-cases`).
2. Katalog 9 świadczeń (`/benefits`).
3. Szczegóły → **Oblicz wysokość** → dokumenty / eZUS lub pracodawca.
4. Dla S2: **Porównaj warianty** urlopu rodzicielskiego.
5. Symulacje: `/zus` (MockZUS), mObywatel DEMO na starcie.
6. Pomoc: `/help` (NGO + odpis aktu gov.pl).
7. PDF: `/documents` — tylko gdy BE analyze działa; nie udajemy odczytu chronionych PDF.

### Przykładowe sprawy

Syntetyczne profile S1–S7 (+ braki danych). **Nie publikujemy oryginalnych PDF spraw ZUS.**  
Jeśli masz lokalny dostęp do materiałów organizatora, porównaj wynik silnika z referencją poza aplikacją.

---

## 3. Architektura (skrót)

| Warstwa | Technologia |
|---|---|
| FE | Expo 58 / RN Web / TypeScript / Expo Router |
| Stan | Zustand (profil) + TanStack Query (eligibility cache) |
| BE | FastAPI — eligibility ×9, calculate, compare, explain, formalities, auth, mock-zus |
| Prawo | Wyłącznie backend (`rules_version`) |

AI (`/legal-advisor/explain`) **wyjaśnia** wynik silnika — nie zmienia statusu.

---

## 4. Publiczne demo

| Element | Status |
|---|---|
| Frontend web (EAS / hosting) | **Do uzupełnienia przez zespół** — skrypty `npm run deploy:web` |
| Backend FastAPI | **Wymaga stałego URL** (nie ngrok) |
| Lokalnie | `npx expo start --web` + `EXPO_PUBLIC_API_MODE=rest` |

Awaryjne nagranie flow: przygotować osobno (≤3 min) — nie zastępuje działającego web.

---

## 5. Prezentacja (≤10 slajdów) — konspekt

1. eBobo — obietnica  
2. Problem rodzica / ZUS  
3. Dlaczego to ważne dla ZUS  
4. Jak działa (ankieta → 9 świadczeń)  
5. Kalkulator i oboje rodzice  
6. Formalności, terminy, linki  
7. Silnik reguł + AI  
8. Przykładowe sprawy (bez PDF)  
9. Architektura i testy  
10. Potencjał wdrożenia + ograniczenia  

Szczegóły: `docs/PRESENTATION_OUTLINE.md`

---

## 6. Film (≤3 min) — scenariusz

Problem → ankieta/przykład → świadczenia → kwota → AI → formalności/eZUS → podsumowanie.

---

## 7. AI — jawne oznaczenie

Wyjaśnienia na szczegółach / review: „AI nie przyznaje świadczenia”. Fallback gdy explain niedostępny.

---

## 8. Ograniczenia (jawne)

- Brak gwarancji przyznania świadczenia.  
- Symulacje mObywatel / MockZUS.  
- Brak dystrybucji chronionych PDF spraw.  
- `/formalities` — live GET; przy awarii UI korzysta z `procedure` z eligibility.  
- `missing_fields` — ustrukturyzowane braki → `/complete-data` (mapowanie po `field`).  
- Znany risk BE: 9 tyg. @70% vs 81,5% (ostrzeżenia FE).  
- Publiczny stały hosting BE/FE — blocker P0 jeśli niepodłączony (ngrok ≠ produkcja).
