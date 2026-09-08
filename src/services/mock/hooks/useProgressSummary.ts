import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockProgressSummary, ProgressSummaryData } from '../mockData';

export function useProgressSummary() {
  return useQuery<ProgressSummaryData>({
    queryKey: ['progressSummary'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockProgressSummary;
    },
  });
}
