# 🗄️ FitVerse Supabase PostgreSQL Schema & Relational Architecture

This document provides a comprehensive breakdown of the 12 core tables in the FitVerse database, their relational constraints, foreign keys, data integrity rules, Row Level Security (RLS) policies, and how they bridge the existing Expo/React Native frontend with upcoming AI/CV pipelines.

---

## Entity Relationship Diagram (ERD)

```
                       auth.users (Supabase Auth)
                                 │ (1:1)
                                 ▼
                          public.profiles
         ┌───────────────────────┼───────────────────────┐
         │ (1:1)                 │ (1:1)                 │ (1:N)
         ▼                       ▼                       ▼
   public.user_goals      public.user_rewards      public.food_logs
         │                                               │
         │ (1:N)                 │ (1:N)                 │ (1:N)
         ▼                       ▼                       ▼
  public.water_logs      public.weight_logs      public.stress_logs
         │                                               │
         │ (1:N)                 │ (1:N)                 │ (1:N)
         ▼                       ▼                       ▼
  public.sleep_logs    public.workout_sessions   public.daily_summaries
                                 │                       │
                                 │ (1:N)                 │ (1:N)
                                 ▼                       ▼
                        public.exercise_logs     public.weekly_summaries
```

---

## Relational Matrix & Table Specifications

### 1. `public.profiles`
- **Primary Key**: `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- **Purpose**: Core profile storing demographic and baseline physical attributes.
- **Relational Connections**:
  - Parent to `user_goals`, `user_rewards`, `food_logs`, `water_logs`, `workout_sessions`, `stress_logs`, `sleep_logs`, `weight_logs`, `daily_summaries`, `weekly_summaries`.
- **Frontend Touchpoints**: `ProfileScreen.tsx`, `HomeScreen.tsx`, `DashboardScreen.tsx`.
- **AI Utility**: Provides age, gender, height, and weight to calibrate daily energy expenditure (BMR/TDEE) and computer vision anthropometric scaling.

---

### 2. `public.user_goals`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE` (Unique 1:1)
- **Purpose**: Stores active training goal (Hypertrophy, Fat Loss, Athleticism, Mobility), activity level, target weight, and target macro distributions.
- **Frontend Touchpoints**: `FitnessGoalScreen.tsx`, `ActivityLevelScreen.tsx`, `ProgressScreen.tsx` (Diet tab MacroRings).
- **AI Utility**: Informs the Nutrition AI engine of daily protein and calorie ceilings, adjusting dietary recommendations based on whether the user is in a surplus or deficit.

---

### 3. `public.food_logs`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Fields**: `food_name`, `quantity`, `quantity_unit`, `meal_type` (Breakfast, Lunch, Dinner, Snack), `calories`, `protein`, `carbs`, `fat`, `fiber`, `logged_at`.
- **Frontend Touchpoints**: `LogFoodModal.tsx`, `MacroRing.tsx`, `dietStore.ts`.
- **AI Utility**: Serves as output destination for Multimodal Food Vision AI (`POST /api/v1/nutrition/analyze-photo`). Enables automated tracking of macronutrient compliance.

---

### 4. `public.water_logs`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Fields**: `amount_ml`, `logged_at`.
- **Frontend Touchpoints**: `WaterTrackerModal.tsx`, `dailyActivityStore.ts`.
- **AI Utility**: Monitors cellular hydration against workout volume to alert user of cramp risks and joint stiffness in `InjuryCoachScreen`.

---

### 5. `public.workout_sessions`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Fields**: `workout_name`, `duration_minutes`, `calories_burned`, `intensity`, `completed`, `started_at`, `completed_at`.
- **Relational Connections**: Parent to `exercise_logs`.
- **Frontend Touchpoints**: `MirrorScreen.tsx`, `WorkoutScreen.tsx`, `workoutSessionStore.ts`, `workoutStore.ts`.
- **AI Utility**: Captures macro workout session envelopes. Feeds total training volume into the Daily Score and Recovery Readiness models.

---

### 6. `public.exercise_logs`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE`
- **Fields**: `exercise_name`, `sets`, `reps`, `weight_kg`, `duration_seconds`, `form_score` (0-100%).
- **Frontend Touchpoints**: `useWorkoutEngine.ts`, `FormScoreGauge.tsx`, `CameraPoseView.tsx`.
- **AI Utility**: Stores granular biomechanic performance. The Computer Vision Pose Detection pipeline writes per-rep form scores, tempo variance, and joint angle telemetry here.

---

### 7. `public.stress_logs`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Fields**: `stress_level` (1 to 5 scale), `mood`, `notes`, `logged_at`.
- **Frontend Touchpoints**: `StressScaleBar.tsx`, `ProgressScreen.tsx` (Weekly Review tab).
- **AI Utility**: Input for systemic CNS fatigue monitoring. If stress exceeds Level 4 for consecutive days, the Injury Coach algorithm automatically recommends deload sessions.

---

### 8. `public.sleep_logs`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Fields**: `sleep_duration_hours`, `sleep_quality` (poor, fair, good, excellent), `bedtime`, `wake_time`, `logged_at`.
- **Frontend Touchpoints**: `SixDimensionsProgress.tsx`, `HomeScreen.tsx`.
- **AI Utility**: Combined with `stress_logs` to calculate the daily recovery index and tune AI workout intensity.

---

### 9. `public.weight_logs`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Fields**: `weight_kg`, `body_fat_percentage`, `muscle_mass`, `logged_at`.
- **Frontend Touchpoints**: `WeightTrackerModal.tsx`, `WeightTrendChart.tsx`, `dailyActivityStore.ts`.
- **AI Utility**: Feeds the Body Transformation Predictor model (`TransformationPredictorScreen.tsx` and `TransformationChart.tsx`), adjusting projection curves according to real weekly weight shifts.

---

### 10. `public.daily_summaries`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Unique Constraint**: `UNIQUE (user_id, date)`
- **Fields**: Total calories, macros (protein, carbs, fat, fiber), total water, workout minutes, calories burned, steps, sleep hours, average stress, `daily_score` (0-100%).
- **Frontend Touchpoints**: `HomeScreen.tsx`, `ProgressScreen.tsx` (Overview KPIs).
- **AI Utility**: Aggregated daily vector used by the Weekly Analysis Service to detect nutritional deficits, overtraining, and adherence patterns.

---

### 11. `public.weekly_summaries`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- **Unique Constraint**: `UNIQUE (user_id, week_start)`
- **Fields**: `week_start`, `week_end`, average calories, average protein, average water, workout days, total workout minutes, average steps, sleep, stress, `weekly_score`, and `ai_analysis` (JSONB).
- **Frontend Touchpoints**: `ProgressScreen.tsx` (Weekly Review tab, `YourJourneyCard.tsx`).
- **AI Utility**: Stores weekly AI insights, natural-language coach diagnostic summaries, and milestone recommendations.

---

### 12. `public.user_rewards`
- **Primary Key**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign Key**: `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE` (Unique 1:1)
- **Fields**: `xp`, `coins`, `level`, `current_streak`, `updated_at`.
- **Frontend Touchpoints**: `gamificationStore.ts`, `LeaderboardScreen.tsx`, `RewardModal.tsx`, `ChallengesScreen.tsx`.
- **AI Utility**: Verified server-side state for gamified progression, ensuring streak protection and fair leaderboard ranking across national tiers.

---

## Security, Automation & Performance Guarantees

1. **Row Level Security (RLS)**:
   - Enabled on 100% of tables.
   - All private health and kinetic data enforces `auth.uid() = user_id`.
   - `exercise_logs` joins through `workout_sessions` to verify user ownership.
   - `user_rewards` permits `SELECT` for all authenticated users to power the real-time National Leaderboard.
2. **Automated User Onboarding (`handle_new_user`)**:
   - A PostgreSQL trigger on `auth.users` automatically provisions the user's `profiles`, `user_rewards`, and initial default `user_goals` upon sign-up.
3. **Automated Timestamps (`update_updated_at_column`)**:
   - Updates `updated_at` automatically on modification for `profiles`, `user_goals`, `daily_summaries`, and `user_rewards`.
4. **Optimized Indexes**:
   - Composite indexes on `(user_id, logged_at DESC)` and `(user_id, date DESC)` provide instant $(<15\text{ms})$ chart loads for 7-day, 30-day, and 90-day time-series views.
