import { ApiClientError } from '@/services/api/httpClient';
import type {
  CalculatorService,
  DocumentsService,
  KnowledgeService,
} from '@/services/api/types';

/** Próbuje REST; przy błędzie sieci/4xx/5xx wraca do mocka z ostrzeżeniem. */
export function withCalculatorFallback(
  rest: CalculatorService,
  mock: CalculatorService,
): CalculatorService {
  return {
    async calculate(input) {
      try {
        return await rest.calculate(input);
      } catch (error) {
        const result = await mock.calculate(input);
        return {
          ...result,
          warnings: [
            `Kalkulator REST niedostępny (${errorMessage(error)}) — wynik mock.`,
            ...result.warnings,
          ],
        };
      }
    },
  };
}

export function withDocumentsFallback(
  rest: DocumentsService,
  mock: DocumentsService,
): DocumentsService {
  return {
    async analyze(input) {
      try {
        return await rest.analyze(input);
      } catch (error) {
        const result = await mock.analyze(input);
        return {
          ...result,
          warnings: [
            `Analiza PDF REST niedostępna (${errorMessage(error)}) — wynik mock.`,
            ...result.warnings,
          ],
          message:
            result.message ??
            'Backend dokumentów niedostępny — pokazano wynik demonstracyjny.',
        };
      }
    },
  };
}

export function withKnowledgeFallback(
  rest: KnowledgeService,
  mock: KnowledgeService,
): KnowledgeService {
  return {
    async getKnowledge() {
      try {
        return await rest.getKnowledge();
      } catch {
        return mock.getKnowledge();
      }
    },
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'błąd';
}
