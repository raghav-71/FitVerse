import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockHomeDashboard, HomeDashboardData } from '../mockData';

export function useHomeDashboard() {
  return useQuery<HomeDashboardData>({
    queryKey: ['homeDashboard'],
    queryFn: async () => {
      await simulateDelay(200);
      return mockHomeDashboard;
    },
  });
}
