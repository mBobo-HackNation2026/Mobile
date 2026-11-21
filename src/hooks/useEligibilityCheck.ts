import { useMutation } from '@tanstack/react-query';

import {
  checkBenefitEligibility,
  DEFAULT_MATERNITY_BENEFIT_CODE,
  type BenefitCode,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheck';

export type EligibilityCheckVariables = {
  benefitCode: BenefitCode;
  request: MaternityLeaveEligibilityRequest;
};

export function useEligibilityCheck() {
  return useMutation<EligibilityCheckResult, Error, EligibilityCheckVariables>({
    mutationFn: ({ benefitCode, request }) =>
      checkBenefitEligibility(benefitCode, request),
    retry: 1,
  });
}

export function useMaternityEligibilityCheck() {
  const mutation = useEligibilityCheck();
  return {
    ...mutation,
    mutateMaternity: (request: MaternityLeaveEligibilityRequest) =>
      mutation.mutate({
        benefitCode: DEFAULT_MATERNITY_BENEFIT_CODE,
        request,
      }),
  };
}
