import { useQuery } from '@tanstack/react-query';
import { simulateDelay } from '../mockClient';
import { mockUserProfile, UserProfileData } from '../mockData';

export function useUserProfile() {
  return useQuery<UserProfileData>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      await simulateDelay(300);
      return mockUserProfile;
    },
  });
}
