import { apiClient } from './client';

export interface WaterLogResponse {
  today_total_ml: number;
  daily_target_ml: number;
  progress_percentage: number;
  glasses: number;
  max_glasses: number;
  logs?: any[];
}

export const WaterApi = {
  async logWater(amountMl: number): Promise<WaterLogResponse> {
    return apiClient.post<WaterLogResponse>('/water/log', { amount_ml: amountMl });
  },

  async getTodayWater(): Promise<WaterLogResponse> {
    return apiClient.get<WaterLogResponse>('/water/today');
  },

  async deleteWaterLog(id: string): Promise<any> {
    return apiClient.delete(`/water/${id}`);
  },
};
