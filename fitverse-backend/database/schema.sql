-- ==============================================================================
-- FitVerse AI — Complete Production-Ready Supabase PostgreSQL Schema
-- ==============================================================================
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 1. Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 10 AND age <= 120),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height_cm NUMERIC(5, 2) CHECK (height_cm > 0),
    weight_kg NUMERIC(5, 2) CHECK (weight_kg > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 2. USER GOALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    activity_level TEXT NOT NULL,
    target_weight NUMERIC(5, 2) CHECK (target_weight > 0),
    daily_calorie_target INTEGER CHECK (daily_calorie_target >= 0),
    daily_protein_target NUMERIC(6, 2) CHECK (daily_protein_target >= 0),
    daily_carbs_target NUMERIC(6, 2) CHECK (daily_carbs_target >= 0),
    daily_fat_target NUMERIC(6, 2) CHECK (daily_fat_target >= 0),
    daily_water_target NUMERIC(5, 2) CHECK (daily_water_target >= 0),
    diet_preference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_goal UNIQUE (user_id)
);

CREATE TRIGGER set_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. FOOD LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    quantity NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
    quantity_unit TEXT NOT NULL DEFAULT 'serving',
    meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
    calories INTEGER NOT NULL CHECK (calories >= 0),
    protein NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (protein >= 0),
    carbs NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (carbs >= 0),
    fat NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (fat >= 0),
    fiber NUMERIC(6, 2) DEFAULT 0.0 CHECK (fiber >= 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. WATER LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_ml NUMERIC(6, 2) NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. WORKOUT SESSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_name TEXT NOT NULL,
    duration_minutes NUMERIC(6, 2) DEFAULT 0.0 CHECK (duration_minutes >= 0),
    calories_burned INTEGER DEFAULT 0 CHECK (calories_burned >= 0),
    intensity TEXT CHECK (intensity IN ('low', 'medium', 'high', 'extreme')),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. EXERCISE LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 1 CHECK (sets >= 1),
    reps INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
    weight_kg NUMERIC(5, 2) DEFAULT 0.0 CHECK (weight_kg >= 0),
    duration_seconds INTEGER DEFAULT 0 CHECK (duration_seconds >= 0),
    form_score NUMERIC(5, 2) CHECK (form_score >= 0 AND form_score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. STRESS LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 5),
    mood TEXT,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. SLEEP LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sleep_duration_hours NUMERIC(4, 2) NOT NULL CHECK (sleep_duration_hours >= 0 AND sleep_duration_hours <= 24),
    sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
    bedtime TIMESTAMPTZ,
    wake_time TIMESTAMPTZ,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. WEIGHT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0),
    body_fat_percentage NUMERIC(4, 2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    muscle_mass NUMERIC(5, 2) CHECK (muscle_mass >= 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. DAILY SUMMARIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    total_calories INTEGER DEFAULT 0 CHECK (total_calories >= 0),
    total_protein NUMERIC(6, 2) DEFAULT 0.0 CHECK (total_protein >= 0),
    total_carbs NUMERIC(6, 2) DEFAULT 0.0 CHECK (total_carbs >= 0),
    total_fat NUMERIC(6, 2) DEFAULT 0.0 CHECK (total_fat >= 0),
    total_fiber NUMERIC(6, 2) DEFAULT 0.0 CHECK (total_fiber >= 0),

    total_water_ml NUMERIC(7, 2) DEFAULT 0.0 CHECK (total_water_ml >= 0),

    workout_minutes NUMERIC(6, 2) DEFAULT 0.0 CHECK (workout_minutes >= 0),
    calories_burned INTEGER DEFAULT 0 CHECK (calories_burned >= 0),

    steps INTEGER DEFAULT 0 CHECK (steps >= 0),
    sleep_hours NUMERIC(4, 2) DEFAULT 0.0 CHECK (sleep_hours >= 0),
    stress_average NUMERIC(3, 2) CHECK (stress_average >= 1.0 AND stress_average <= 5.0),

    daily_score NUMERIC(5, 2) CHECK (daily_score >= 0 AND daily_score <= 100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_daily_summary UNIQUE (user_id, date)
);

CREATE TRIGGER set_daily_summaries_updated_at
BEFORE UPDATE ON public.daily_summaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 11. WEEKLY SUMMARIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    week_start DATE NOT NULL,
    week_end DATE NOT NULL,

    average_calories INTEGER DEFAULT 0 CHECK (average_calories >= 0),
    average_protein NUMERIC(6, 2) DEFAULT 0.0 CHECK (average_protein >= 0),
    average_water_ml NUMERIC(7, 2) DEFAULT 0.0 CHECK (average_water_ml >= 0),

    workout_days INTEGER DEFAULT 0 CHECK (workout_days >= 0 AND workout_days <= 7),
    total_workout_minutes NUMERIC(7, 2) DEFAULT 0.0 CHECK (total_workout_minutes >= 0),

    average_steps INTEGER DEFAULT 0 CHECK (average_steps >= 0),
    average_sleep_hours NUMERIC(4, 2) DEFAULT 0.0 CHECK (average_sleep_hours >= 0),
    average_stress NUMERIC(3, 2) CHECK (average_stress >= 1.0 AND average_stress <= 5.0),

    weekly_score NUMERIC(5, 2) CHECK (weekly_score >= 0 AND weekly_score <= 100),

    ai_analysis JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_weekly_summary UNIQUE (user_id, week_start)
);

-- ==============================================================================
-- 12. USER REWARDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_rewards UNIQUE (user_id)
);

CREATE TRIGGER set_user_rewards_updated_at
BEFORE UPDATE ON public.user_rewards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_logged ON public.food_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_meal_type ON public.food_logs(user_id, meal_type);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_logged ON public.water_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_started ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed ON public.workout_sessions(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON public.exercise_logs(workout_session_id);

CREATE INDEX IF NOT EXISTS idx_stress_logs_user_logged ON public.stress_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_logged ON public.sleep_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_logged ON public.weight_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON public.weekly_summaries(user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_rewards_xp ON public.user_rewards(xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_rewards_streak ON public.user_rewards(current_streak DESC);

-- ==============================================================================
-- AUTOMATIC NEW USER INITIALIZATION TRIGGER
-- ==============================================================================
-- When a user registers via Supabase Auth, automatically instantiate their
-- profile, starter rewards (Level 1, 0 XP), and default user goal.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_rewards (user_id, xp, coins, level, current_streak, updated_at)
    VALUES (NEW.id, 0, 0, 1, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_goals (user_id, goal, activity_level, daily_calorie_target, daily_protein_target, daily_water_target)
    VALUES (NEW.id, 'Build Muscle', 'Moderately Active', 2200, 150, 3.0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. User Goals
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
ON public.user_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals"
ON public.user_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Food Logs
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food logs"
ON public.food_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs"
ON public.food_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs"
ON public.food_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs"
ON public.food_logs FOR DELETE
USING (auth.uid() = user_id);

-- 4. Water Logs
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own water logs"
ON public.water_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own water logs"
ON public.water_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Workout Sessions
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout sessions"
ON public.workout_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workout sessions"
ON public.workout_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Exercise Logs (Linked through Workout Session)
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise logs"
ON public.exercise_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = exercise_logs.workout_session_id
        AND ws.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = exercise_logs.workout_session_id
        AND ws.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own exercise logs"
ON public.exercise_logs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = exercise_logs.workout_session_id
        AND ws.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own exercise logs"
ON public.exercise_logs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = exercise_logs.workout_session_id
        AND ws.user_id = auth.uid()
    )
);

-- 7. Stress Logs
ALTER TABLE public.stress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stress logs"
ON public.stress_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own stress logs"
ON public.stress_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Sleep Logs
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep logs"
ON public.sleep_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sleep logs"
ON public.sleep_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Weight Logs
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weight logs"
ON public.weight_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own weight logs"
ON public.weight_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. Daily Summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily summaries"
ON public.daily_summaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own daily summaries"
ON public.daily_summaries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. Weekly Summaries
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly summaries"
ON public.weekly_summaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own weekly summaries"
ON public.weekly_summaries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 12. User Rewards (Leaderboard visibility allows all authenticated users to view rank/XP)
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leaderboard rewards"
ON public.user_rewards FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can only update their own rewards"
ON public.user_rewards FOR UPDATE
USING (auth.uid() = user_id);
