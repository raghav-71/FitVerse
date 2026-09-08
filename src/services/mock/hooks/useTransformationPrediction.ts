import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockTransformationPrediction, TransformationPredictionData } from '../mockData';

export function useTransformationPrediction() {
  return useQuery<TransformationPredictionData[]>({
    queryKey: ['transformationPrediction'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockTransformationPrediction;
    },
  });
}
