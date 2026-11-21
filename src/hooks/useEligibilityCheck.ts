import { useMutation } from '@tanstack/react-query';

import {
  checkMaternityEligibility,
  type EligibilityCheckResult,
  type MaternityLeaveEligibilityRequest,
} from '@/services/api/eligibilityCheck';

export function useEligibilityCheck() {
  return useMutation<EligibilityCheckResult, Error, MaternityLeaveEligibilityRequest>({
    mutationFn: (input) => checkMaternityEligibility(input),
    retry: 1,
  });
}
