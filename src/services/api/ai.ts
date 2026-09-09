import {
  AiService,
  InjuryScreenResponse,
  DietPlanParams,
  DietPlanResponse,
  MealItemDetail,
  DailyAnalysisResponse,
  WeeklyReportData,
} from './aiService';

export const AiApi = AiService;
export { AiService };

export type {
  InjuryScreenResponse,
  DietPlanParams,
  DietPlanResponse,
  MealItemDetail,
  DailyAnalysisResponse,
  WeeklyReportData,
  WeeklyReportData as WeeklyReportResponse,
};
