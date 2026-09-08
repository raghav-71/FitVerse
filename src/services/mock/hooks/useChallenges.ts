import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockChallenges, ChallengeItem } from '../mockData';

export function useChallenges() {
  return useQuery<ChallengeItem[]>({
    queryKey: ['challenges'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockChallenges;
    },
  });
}
