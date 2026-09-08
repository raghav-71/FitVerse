import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockExercises, ExerciseItem } from '../mockData';

export function useExercises() {
  return useQuery<ExerciseItem[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockExercises;
    },
  });
}
