import {
  InjuryService,
  InjuryAnalyzeInput,
  InjuryAnalyzeResponse,
  ExerciseClearance,
  InjuryProfileInput,
  InjuryProfileResponse,
} from './injuryService';

export const InjuryApi = {
  ...InjuryService,
  saveProfile: InjuryService.saveInjuryProfile,
};
export { InjuryService };

export type {
  InjuryAnalyzeInput,
  InjuryAnalyzeResponse,
  ExerciseClearance,
  InjuryProfileInput,
  InjuryProfileResponse,
};
