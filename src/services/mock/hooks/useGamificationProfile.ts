import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockGamificationProfile, GamificationProfileData } from '../mockData';

export function useGamificationProfile() {
  return useQuery<GamificationProfileData>({
    queryKey: ['gamificationProfile'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockGamificationProfile;
    },
  });
}
