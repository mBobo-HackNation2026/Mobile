import { useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { DocumentAssistantSection } from '@/features/extensions/DocumentAssistantSection';
import { RETIRED_FORMS_NOTE } from '@/features/documents/requiredDocuments';
import {
  ApiClientError,
  documentsService,
  eligibilityService,
  getApiMode,
  knowledgeService,
} from '@/services/api';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { useUserJourneyStore } from '@/store/useUserJourneyStore';
import { colors, spacing, typography } from '@/theme';

type UiPhase = 'idle' | 'picking' | 'analyzing' | 'ready' | 'error' | 'unsupported';

export function DocumentsScreen() {
  const mode = getApiMode();
  const setProfile = useUserJourneyStore((s) => s.setProfile);
  const analysis = useDocumentsStore((s) => s.analysis);
  const lastFileName = useDocumentsStore((s) => s.lastFileName);
  const correctedFields = useDocumentsStore((s) => s.correctedFields);
  const confirmed = useDocumentsStore((s) => s.confirmed);
  const setAnalysis = useDocumentsStore((s) => s.setAnalysis);
  const setFieldValue = useDocumentsStore((s) => s.setFieldValue);
  const confirmCorrections = useDocumentsStore((s) => s.confirmCorrections);
  const clearDocuments = useDocumentsStore((s) => s.clearDocuments);
  const getMergedFields = useDocumentsStore((s) => s.getMergedFields);

  const [phase, setPhase] = useState<UiPhase>(analysis ? 'ready' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');

  const profile = useUserJourneyStore((s) => s.profile);

  const knowledgeQuery = useQuery({
    queryKey: ['knowledge'],
    queryFn: () => knowledgeService.getKnowledge(),
    staleTime: 60_000,
  });

  const eligibilityQuery = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => eligibilityService.evaluate(profile),
    enabled: profile.onboardingCompleted,
  });

  const pickAndAnalyze = async () => {
    try {
      setPhase('picking');
      setErrorMessage('');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setPhase(analysis ? 'ready' : 'idle');
        return;
      }

      const asset = result.assets[0];
      const isPdf =
        asset.mimeType === 'application/pdf' ||
        asset.name?.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        setPhase('unsupported');
        setErrorMessage('Obsługujemy tylko PDF w tym demo.');
        return;
      }

      setPhase('analyzing');
      const analyzed = await documentsService.analyze({
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
        sizeBytes: asset.size,
      });

      if (analyzed.status === 'unsupported') {
        setAnalysis(asset.name, analyzed);
        setPhase('unsupported');
        setErrorMessage(analyzed.message ?? 'Nieobsługiwany plik.');
        return;
      }

      if (analyzed.status === 'error') {
        setPhase('error');
        setErrorMessage(analyzed.message ?? 'Analiza nie powiodła się.');
        return;
      }

      setAnalysis(asset.name, analyzed);
      setPhase('ready');
    } catch (error) {
      setPhase('error');
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Nie udało się wybrać lub przeanalizować pliku.');
      }
    }
  };

  const applyToProfile = () => {
    const fields = getMergedFields();
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f.value]));
    const eventDate = byKey.event_date?.trim();

    if (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      setProfile({ eventDate });
    }

    confirmCorrections();
  };

  return (
    <Screen>
      <DemoBanner message="Upload i odczyt PDF są demonstracyjne / z API. To nie jest złożenie wniosku w ZUS." />

      <View style={styles.header}>
        <Text style={styles.title}>Dokumenty i formularze</Text>
        <Text style={styles.subtitle}>
          Co złożyć, gdzie i po co — oraz podgląd danych z PDF z możliwością korekty przed
          dalszymi krokami.
        </Text>
        <Badge label={mode === 'rest' ? 'Analiza: REST' : 'Analiza: Mock'} tone="primary" />
      </View>

      {eligibilityQuery.data?.documentAssistant ? (
        <DocumentAssistantSection bundle={eligibilityQuery.data.documentAssistant} />
      ) : profile.onboardingCompleted ? (
        <Card>
          <Text style={styles.section}>Asystent dokumentów</Text>
          <Text style={styles.body}>Ładujemy powiązania dokumentów z wnioskami…</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.section}>Asystent dokumentów</Text>
          <Text style={styles.body}>
            Ukończ ankietę albo wczytaj profil demo — wtedy oznaczymy dokumenty pod konkretny
            wniosek.
          </Text>
          <Button label="Ankieta / demo" onPress={() => router.push('/onboarding')} />
        </Card>
      )}
      <Text style={styles.warning}>{RETIRED_FORMS_NOTE}</Text>

      {knowledgeQuery.data ? (
        <Card>
          <Text style={styles.section}>Baza wiedzy (API / mock)</Text>
          {knowledgeQuery.data.items.map((item) => (
            <View key={item.id} style={styles.docRow}>
              <Text style={styles.docTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.summary}</Text>
              {item.officialUrl ? (
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL(item.officialUrl!)}
                  accessibilityRole="link"
                >
                  {item.officialUrl}
                </Text>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.section}>Wgraj PDF przykładowej sprawy</Text>
        <Text style={styles.body}>
          Jury może wgrać skan / PDF. Pokażemy odczytane pola (demo) i pozwolimy je
          poprawić przed użyciem w planie.
        </Text>
        <Button
          label={
            phase === 'analyzing' || phase === 'picking'
              ? 'Przetwarzanie…'
              : 'Wybierz PDF'
          }
          onPress={pickAndAnalyze}
          disabled={phase === 'analyzing' || phase === 'picking'}
        />
        {lastFileName ? <Text style={styles.meta}>Plik: {lastFileName}</Text> : null}
        {phase === 'analyzing' ? (
          <Text style={styles.message}>Analizujemy dokument…</Text>
        ) : null}
        {phase === 'unsupported' ? <Badge label="Nieobsługiwany plik" tone="warning" /> : null}
        {phase === 'error' ? <Badge label="Błąd" tone="danger" /> : null}
        {errorMessage ? <Text style={styles.message}>{errorMessage}</Text> : null}
      </Card>

      {analysis && phase === 'ready' ? (
        <Card>
          <View style={styles.docHeader}>
            <Text style={styles.section}>Odczytane pola</Text>
            <Badge
              label={
                analysis.status === 'ok'
                  ? 'OK'
                  : analysis.status === 'partial'
                    ? 'Częściowy odczyt'
                    : analysis.status
              }
              tone={analysis.status === 'ok' ? 'success' : 'warning'}
            />
          </View>
          {analysis.documentType ? (
            <Text style={styles.meta}>Typ dokumentu: {analysis.documentType}</Text>
          ) : null}
          {analysis.message ? <Text style={styles.body}>{analysis.message}</Text> : null}
          {analysis.warnings.map((warning) => (
            <Text key={warning} style={styles.warning}>
              {warning}
            </Text>
          ))}

          {analysis.fields.map((field) => (
            <View key={field.key} style={styles.field}>
              {field.editable ? (
                <TextField
                  label={field.label}
                  value={correctedFields[field.key] ?? ''}
                  onChangeText={(value) => setFieldValue(field.key, value)}
                  hint={
                    field.confidence != null
                      ? `Pewność odczytu (demo): ${Math.round(field.confidence * 100)}%`
                      : 'Uzupełnij lub popraw przed dalszymi krokami'
                  }
                />
              ) : (
                <>
                  <Text style={styles.meta}>{field.label}</Text>
                  <Text style={styles.body}>{field.value ?? '—'}</Text>
                </>
              )}
            </View>
          ))}

          <View style={styles.actions}>
            <Button
              label={confirmed ? 'Dane potwierdzone' : 'Zapisz korektę do planu'}
              onPress={applyToProfile}
              disabled={confirmed}
            />
            <Button
              label="Otwórz Mój plan"
              variant="secondary"
              onPress={() => router.push('/dashboard')}
            />
            <Button
              label="Wyczyść upload"
              variant="ghost"
              onPress={() => {
                clearDocuments();
                setPhase('idle');
                setErrorMessage('');
              }}
            />
          </View>
          {confirmed ? (
            <Text style={styles.success}>
              Korekta zapisana lokalnie. Data z dokumentu trafia do profilu, jeśli była w
              formacie RRRR-MM-DD.
            </Text>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, maxWidth: 720 },
  section: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  meta: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  link: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.sm },
  warning: { ...typography.small, color: colors.warning, marginTop: spacing.xs },
  success: { ...typography.small, color: colors.accent, marginTop: spacing.sm },
  message: { ...typography.small, color: colors.textSecondary, marginTop: spacing.sm },
  docRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xxs,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  docTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  field: { marginTop: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
