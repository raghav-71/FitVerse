import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockLeaderboard, LeaderboardEntry } from '../mockData';

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockLeaderboard;
    },
  });
}
