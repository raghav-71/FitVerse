import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockApi } from './api';
import { UserProfile, WorkoutSummary } from './types';

export const QUERY_KEYS = {
  userProfile: ['userProfile'],
  exercises: ['exercises'],
  exerciseDetail: (id: string) => ['exercise', id],
  gamification: ['gamification'],
  achievements: ['achievements'],
  leaderboard: ['leaderboard'],
  challenges: ['challenges'],
  transformation: ['transformation'],
  notifications: ['notifications'],
};

export function useUserProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => MockApi.getUserProfile(),
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<UserProfile>) => MockApi.updateUserProfile(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.userProfile, data);
    },
  });
}

export function useExercises() {
  return useQuery({
    queryKey: QUERY_KEYS.exercises,
    queryFn: () => MockApi.getExercises(),
  });
}

export function useExerciseDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exerciseDetail(id),
    queryFn: () => MockApi.getExerciseById(id),
    enabled: !!id,
  });
}

export function useGamificationProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.gamification,
    queryFn: () => MockApi.getGamificationProfile(),
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: QUERY_KEYS.achievements,
    queryFn: () => MockApi.getAchievements(),
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard,
    queryFn: () => MockApi.getLeaderboard(),
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: QUERY_KEYS.challenges,
    queryFn: () => MockApi.getChallenges(),
  });
}

export function useToggleJoinChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => MockApi.toggleJoinChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challenges });
    },
  });
}

export function useTransformationPredictor() {
  return useQuery({
    queryKey: QUERY_KEYS.transformation,
    queryFn: () => MockApi.getTransformationPrediction(),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => MockApi.getNotifications(),
  });
}

export function useSubmitWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (summary: Omit<WorkoutSummary, 'id' | 'date'>) => MockApi.submitWorkout(summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gamification });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.achievements });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard });
    },
  });
}
