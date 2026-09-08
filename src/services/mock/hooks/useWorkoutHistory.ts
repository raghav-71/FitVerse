import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockWorkoutHistory, WorkoutSessionSummary } from '../mockData';

export function useWorkoutHistory() {
  return useQuery<WorkoutSessionSummary[]>({
    queryKey: ['workoutHistory'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockWorkoutHistory;
    },
  });
}
