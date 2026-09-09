from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database.supabase import get_supabase
from app.core.logging import logger
from app.schemas.injury import (
    InjuryAnalyzeInput,
    InjuryAnalyzeResponse,
    ExerciseClearanceItem,
    InjuryProfileInput,
    InjuryProfileResponse,
    InjuryRuleConfig,
)

# Standard Non-Diagnostic Medical Disclaimer
STANDARD_MEDICAL_DISCLAIMER = (
    "FitVerse Injury Prevention Coach provides general fitness guidance and exercise modifications for educational "
    "purposes only. It is not a medical device, diagnosis, or clinical treatment plan. For severe symptoms, sharp pain, "
    "or persistent discomfort, discontinue exercise immediately and seek evaluation from a licensed physician or physical therapist."
)

# In-memory storage for dev / offline mode
DEV_INJURY_PROFILES: Dict[str, Dict[str, Any]] = {}


class InjurySafetyService:
    def __init__(self):
        # Configurable thresholds and red flags
        self.config = InjuryRuleConfig(
            high_pain_threshold=7,
            moderate_pain_threshold=4,
            red_flag_keywords=[
                "sharp", "radiating", "numbness", "tingling", "swelling",
                "cannot bear weight", "pop", "popping", "locking", "unbearable", "severe"
            ],
            disclaimer=STANDARD_MEDICAL_DISCLAIMER
        )

        # Configurable exercise safety rules per body area
        self.rules: Dict[str, Dict[str, Any]] = {
            "knee": {
                "display_name": "Knee Joint",
                "high_avoid": [
                    "Barbell Back Squat",
                    "Dynamic Walking Lunges",
                    "Plyometric Box Jumps",
                    "Heavy Leg Extensions",
                    "Running / Sprinting on Hard Surfaces"
                ],
                "moderate_avoid": [
                    "Barbell Back Squat (below 90°)",
                    "Deep Dynamic Lunges",
                    "Leg Extensions past 45°",
                    "High-Impact Jumping"
                ],
                "low_avoid": [
                    "Uncontrolled rapid squats",
                    "Knee valgus inward collapse"
                ],
                "alternatives": [
                    "High Box Squat (limited to 90°)",
                    "Supported Glute Bridge",
                    "Reverse Static Lunge",
                    "Seated Leg Press with limited ROM",
                    "Stationary Cycling (low resistance)",
                    "Swimming / Water Aerobics"
                ],
                "clearances": [
                    {
                        "name": "Barbell Back Squat",
                        "target": "Quads & Glutes",
                        "high_status": "BLOCK",
                        "high_reason": "High axial compressive load & patellar shear exceed safe recovery limits.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Enforce 90° knee tracking depth limit to avoid patellar compression.",
                        "safe_status": "SAFE",
                        "safe_reason": "Full biomechanical clearance. Unrestricted squat depth permitted.",
                        "alternative": "High Box Squat",
                        "benefit": "Limits joint flexion past 90° while maintaining quad recruitment"
                    },
                    {
                        "name": "Dynamic Lunges",
                        "target": "Quads & Balance",
                        "high_status": "BLOCK",
                        "high_reason": "Deceleration impact produces high patellar tendon strain.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Impact force may aggravate anterior knee structures.",
                        "safe_status": "SAFE",
                        "safe_reason": "Knee stability cleared for dynamic lunging.",
                        "alternative": "Reverse Static Lunge",
                        "benefit": "Eliminates forward deceleration force on patellar tendon"
                    }
                ],
                "guidance_high": [
                    "Immediately discontinue high-impact jumping, deep squatting, and heavy leg loading.",
                    "Rest the knee joint and avoid forcing full flexion or hyperextension.",
                    "CRITICAL: Given the high pain level or symptoms, please discontinue strenuous lower-body exercise and seek clinical evaluation from a physician or physical therapist."
                ],
                "guidance_moderate": [
                    "Cap squat and lunge depth at 90° to prevent excessive patellar tendon tension.",
                    "Emphasize posterior chain exercises (glute bridges, hamstring curls) to balance knee joint forces.",
                    "Perform 5-10 minutes of low-resistance stationary cycling to lubricate joint synovial fluid before workouts."
                ],
                "guidance_low": [
                    "Warm up with bodyweight glute bridges and quad foam rolling.",
                    "Ensure knees track directly in line with second toes during all compound lifts."
                ]
            },
            "shoulder": {
                "display_name": "Shoulder Girdle",
                "high_avoid": [
                    "Overhead Barbell Press",
                    "Behind-the-Neck Pulls",
                    "Weighted Dips",
                    "Upright Barbell Rows",
                    "Kipping Pull-Ups"
                ],
                "moderate_avoid": [
                    "Heavy Overhead Press to full lockout",
                    "Deep Dips beyond 90° elbow flexion",
                    "Wide-Grip Barbell Bench Press"
                ],
                "low_avoid": [
                    "Uncontrolled flaring of elbows past 70°"
                ],
                "alternatives": [
                    "Incline Landmine Press",
                    "Neutral-Grip Dumbbell Press",
                    "Cable Face Pulls with external rotation",
                    "Chest-Supported Lateral Raises",
                    "Scapular Push-Ups"
                ],
                "clearances": [
                    {
                        "name": "Overhead Barbell Press",
                        "target": "Anterior Delts",
                        "high_status": "BLOCK",
                        "high_reason": "High subacromial impingement risk under full vertical lockout.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Monitor elbow angle to prevent excessive flaring beyond 70°.",
                        "safe_status": "SAFE",
                        "safe_reason": "Shoulder girdle mobility cleared for complete vertical lockout.",
                        "alternative": "Incline Landmine Press",
                        "benefit": "Preserves scapular rhythm at a comfortable 45° pressing plane"
                    }
                ],
                "guidance_high": [
                    "Pause all overhead pressing, hanging movements, and heavy anterior delt loads.",
                    "Avoid sleeping directly on the affected shoulder and avoid carrying heavy bags on this side.",
                    "CRITICAL: High shoulder discomfort or impingement requires professional orthopedic assessment."
                ],
                "guidance_moderate": [
                    "Switch from straight barbell presses to neutral-grip dumbbells or landmine press.",
                    "Focus on rotator cuff external rotations and scapular retractions with light resistance bands.",
                    "Keep pressing angles between 30° to 45° to preserve subacromial space."
                ],
                "guidance_low": [
                    "Incorporate face pulls and band pull-aparts into your upper-body warmup.",
                    "Keep elbows tucked at approximately 45-60 degrees relative to your torso when bench pressing."
                ]
            },
            "back": {
                "display_name": "Lower Back & Lumbar",
                "high_avoid": [
                    "Heavy Romanian Deadlifts",
                    "Conventional Barbell Deadlifts",
                    "Good Mornings",
                    "Standing Bent-Over Barbell Rows",
                    "Back Extensions with spinal flexion"
                ],
                "moderate_avoid": [
                    "Heavy axial loaded spinal movements",
                    "Uncontrolled hip hinges",
                    "Deep spinal rotation under load"
                ],
                "low_avoid": [
                    "Lumbar rounding beyond 8° during hinge movements"
                ],
                "alternatives": [
                    "Chest-Supported Dumbbell Rows",
                    "Cable Pull-Throughs",
                    "Hip Thrusts with stable back support",
                    "Bird-Dog / McGill Big 3",
                    "Plank Isometric Holds (neutral spine)"
                ],
                "clearances": [
                    {
                        "name": "Romanian Deadlift",
                        "target": "Hamstrings & Lumbar",
                        "high_status": "BLOCK",
                        "high_reason": "Acute lumbar shear risk detected under hip hinge torsion.",
                        "mod_status": "CAUTION",
                        "mod_reason": "AI spine keypoints monitor for lumbar rounding exceeding 8°.",
                        "safe_status": "SAFE",
                        "safe_reason": "Spine and pelvic alignment verified. Full kinetic chain unlocked.",
                        "alternative": "Chest-Supported Row",
                        "benefit": "Decompresses lumbar spine with zero axial torque"
                    }
                ],
                "guidance_high": [
                    "Stop all spinal loading and heavy hinging immediately.",
                    "Avoid sustained sitting; alternate between brief walking and lying flat on a firm surface.",
                    "CRITICAL: If you experience radiating leg numbness, sharp spasms, or tingling, seek immediate medical evaluation."
                ],
                "guidance_moderate": [
                    "Replace freestanding barbell rows with chest-supported machines or incline bench dumbbell rows.",
                    "Perform McGill Big 3 core stabilization (Bird-Dogs, Side Planks, Curl-Ups) to build spinal endurance.",
                    "Maintain neutral pelvis and brace abdominal wall prior to lifting weights off the rack."
                ],
                "guidance_low": [
                    "Warm up with cat-cow mobility and glute bridges.",
                    "Focus on hip hinge mechanics from the hips rather than rounding the lumbar spine."
                ]
            },
            "neck": {
                "display_name": "Cervical Neck & Traps",
                "high_avoid": [
                    "Behind-the-Neck Lat Pulldowns",
                    "Heavy Barbell Shrugs",
                    "Overhead Snatches",
                    "Neck Bridges / Wrestler Bridges"
                ],
                "moderate_avoid": [
                    "High-speed upper trap loading",
                    "Forward head postured pressing"
                ],
                "low_avoid": [
                    "Excessive cervical extension during lifts"
                ],
                "alternatives": [
                    "Neutral-Grip Lat Pulldowns to upper chest",
                    "Trap-3 Incline Raises",
                    "Chin Tucks and Isometric Cervical Holds",
                    "Seated Cable Rows with neutral head alignment"
                ],
                "clearances": [
                    {
                        "name": "Behind-the-Neck Pulldown",
                        "target": "Lats & Traps",
                        "high_status": "BLOCK",
                        "high_reason": "Severe cervical spine strain and shoulder anterior capsule overstretch.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Suboptimal neck torque; pull to chest instead.",
                        "safe_status": "SAFE",
                        "safe_reason": "Optimal pulling mechanics with neutral cervical alignment.",
                        "alternative": "Neutral-Grip Lat Pulldown",
                        "benefit": "Maintains spine neutral while isolating lats"
                    }
                ],
                "guidance_high": [
                    "Avoid any exercises placing mechanical strain on the neck or upper trapezius.",
                    "CRITICAL: If neck pain is accompanied by dizziness, headaches, or arm numbness, seek urgent clinical care."
                ],
                "guidance_moderate": [
                    "Maintain a neutral chin tuck during all upper-body pulling and pressing exercises.",
                    "Avoid looking up at the ceiling or jerking the neck during heavy sets."
                ],
                "guidance_low": [
                    "Perform gentle neck lateral flexions and chin retractions before training."
                ]
            },
            "wrist": {
                "display_name": "Wrist & Forearm",
                "high_avoid": [
                    "Straight Barbell Bicep Curls",
                    "Fixed Straight Barbell Flat Bench Press",
                    "Front Squats with wrist rack position",
                    "Floor Push-Ups on flat palms"
                ],
                "moderate_avoid": [
                    "Extreme wrist hyperextension under load",
                    "Heavy straight-bar curls"
                ],
                "low_avoid": [
                    "Wrist flexion/extension angle collapse"
                ],
                "alternatives": [
                    "EZ-Bar Curls / Hammer Curls",
                    "Neutral-Grip Dumbbell Bench Press",
                    "Push-Ups on handles or knuckles",
                    "Cross-Arm Front Squats or Safety Bar Squats",
                    "Dumbbell Neutral Press"
                ],
                "clearances": [
                    {
                        "name": "Barbell Flat Bench",
                        "target": "Chest & Triceps",
                        "high_status": "BLOCK",
                        "high_reason": "Fixed bar position produces ulnar wrist extension strain under heavy loads.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Watch for wrist bending backwards past 20°.",
                        "safe_status": "SAFE",
                        "safe_reason": "Optimal horizontal pressing mechanics with no joint bottlenecks.",
                        "alternative": "Neutral-Grip DB Bench",
                        "benefit": "Allows natural wrist stack over forearm with zero torsion"
                    }
                ],
                "guidance_high": [
                    "Avoid loading the wrists into extension or heavy torque.",
                    "CRITICAL: Discontinue exercise and consult a medical practitioner if swelling or persistent wrist instability exists."
                ],
                "guidance_moderate": [
                    "Use neutral wrist grips (palms facing each other) for pressing and rowing.",
                    "Use push-up handles or dumbbells to maintain a straight wrist stack during floor movements."
                ],
                "guidance_low": [
                    "Warm up wrists with forearm extensor and flexor stretches before upper body workouts."
                ]
            },
            "ankle": {
                "display_name": "Ankle & Achilles",
                "high_avoid": [
                    "Box Jumps & Depth Drops",
                    "Sprint Intervals / Hill Sprints",
                    "Heavy Ballistic Calf Bounces",
                    "High-Impact Agility Drills"
                ],
                "moderate_avoid": [
                    "Explosive plyometrics",
                    "Running on uneven or hard concrete surfaces"
                ],
                "low_avoid": [
                    "Sudden lateral ankle roll movements"
                ],
                "alternatives": [
                    "Seated Calf Raises (controlled eccentric)",
                    "Elliptical Cross-Trainer",
                    "Rowing Machine",
                    "Leg Press Calf Extensions with slow tempo",
                    "Swimming"
                ],
                "clearances": [
                    {
                        "name": "Box Jumps & Plyos",
                        "target": "Power & Calves",
                        "high_status": "BLOCK",
                        "high_reason": "High ground reaction impact force strains talar joint and Achilles tendon.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Replace landing impact with smooth eccentric loading.",
                        "safe_status": "SAFE",
                        "safe_reason": "Ankle stability and dorsiflexion mobility cleared.",
                        "alternative": "Elliptical Trainer",
                        "benefit": "Cardiovascular conditioning with near-zero impact forces"
                    }
                ],
                "guidance_high": [
                    "Avoid all jumping, bounding, and high-impact running.",
                    "CRITICAL: If you cannot bear weight or notice visible deformity or severe swelling, seek medical attention."
                ],
                "guidance_moderate": [
                    "Opt for low-impact cardio such as rowing or the elliptical trainer.",
                    "Perform slow, controlled ankle circles and calf stretches on an incline board."
                ],
                "guidance_low": [
                    "Work on ankle dorsiflexion mobility against a wall before lower body lifting."
                ]
            },
            "other": {
                "display_name": "Other Joint Area",
                "high_avoid": [
                    "High-impact explosive movements",
                    "End-range heavy loaded lifts",
                    "Exercises eliciting sharp localized pain"
                ],
                "moderate_avoid": [
                    "Aggressive ballistic training",
                    "Uncontrolled eccentric drops"
                ],
                "low_avoid": [
                    "Poor movement cadence"
                ],
                "alternatives": [
                    "Machine-supported exercises with guided range of motion",
                    "Isometric contraction holds",
                    "Low-impact Zone 2 steady-state cardio"
                ],
                "clearances": [
                    {
                        "name": "Compound Multi-Joint Lift",
                        "target": "Full Kinetic Chain",
                        "high_status": "BLOCK",
                        "high_reason": "Sharp discomfort requires pausing compound loading on this area.",
                        "mod_status": "CAUTION",
                        "mod_reason": "Train with controlled tempo and reduced load.",
                        "safe_status": "SAFE",
                        "safe_reason": "Standard kinetic safety cleared.",
                        "alternative": "Isometric Hold",
                        "benefit": "Muscular activation without dynamic joint irritation"
                    }
                ],
                "guidance_high": [
                    "Discontinue exercise involving the sensitive area immediately.",
                    "CRITICAL: Consult a licensed health professional for unexplained joint or muscle pain."
                ],
                "guidance_moderate": [
                    "Train within a pain-free range of motion (0-3 discomfort on 10 scale).",
                    "Prioritize controlled tempo repetitions (3 seconds lowering, 1 second hold)."
                ],
                "guidance_low": [
                    "Ensure adequate 5-10 minute whole body warmup prior to resistance training."
                ]
            }
        }

    def _normalize_body_part(self, body_part: str) -> str:
        bp = (body_part or "").lower().strip()
        if "knee" in bp or "patell" in bp or "menisc" in bp:
            return "knee"
        elif "shoulder" in bp or "deltoid" in bp or "rotator" in bp:
            return "shoulder"
        elif "back" in bp or "lumbar" in bp or "spine" in bp or "erector" in bp:
            return "back"
        elif "neck" in bp or "cervical" in bp or "trap" in bp:
            return "neck"
        elif "wrist" in bp or "forearm" in bp or "carpal" in bp:
            return "wrist"
        elif "ankle" in bp or "achilles" in bp or "foot" in bp or "talar" in bp:
            return "ankle"
        else:
            return "other"

    def _has_red_flags(self, pain_description: Optional[str], recent_injury: Optional[str]) -> bool:
        text = f"{pain_description or ''} {recent_injury or ''}".lower()
        return any(keyword in text for keyword in self.config.red_flag_keywords)

    def analyze_injury(self, input_data: InjuryAnalyzeInput) -> InjuryAnalyzeResponse:
        """
        Core intelligence method evaluating user's reported concern against configurable safety rules.
        """
        norm_part = self._normalize_body_part(input_data.body_part)
        rule_data = self.rules.get(norm_part, self.rules["other"])
        pain_level = input_data.pain_level
        has_flags = self._has_red_flags(input_data.pain_description, input_data.recent_injury)

        # 1. Determine Caution Level
        if pain_level >= self.config.high_pain_threshold or has_flags:
            caution_level = "high"
        elif pain_level >= self.config.moderate_pain_threshold:
            caution_level = "moderate"
        else:
            caution_level = "low"

        # 2. Select Avoidances & Alternatives
        if caution_level == "high":
            avoid_list = list(rule_data["high_avoid"])
            guidance_list = list(rule_data["guidance_high"])
        elif caution_level == "moderate":
            avoid_list = list(rule_data["moderate_avoid"])
            guidance_list = list(rule_data["guidance_moderate"])
        else:
            avoid_list = list(rule_data["low_avoid"])
            guidance_list = list(rule_data["guidance_low"])

        alternatives_list = list(rule_data["alternatives"])

        # 3. Add Goal-Specific Recommendations
        goal = (input_data.goal or "general_fitness").lower().strip()
        if goal == "fat_loss":
            if caution_level == "high":
                guidance_list.append("Goal Note: Focus on gentle upper-body or non-weight-bearing cardio (e.g. seated arms, water exercise) to preserve caloric expenditure without loading the joint.")
            else:
                guidance_list.append("Goal Note: Emphasize low-impact Zone 2 cardio (incline walking, stationary cycling) to maximize fat oxidation while protecting joint cartilage.")
        elif goal == "muscle_gain":
            if caution_level == "high":
                guidance_list.append("Goal Note: Shift focus to uninvolved muscle groups and allow the sensitive area to fully recover before applying progressive overload.")
            else:
                guidance_list.append("Goal Note: Utilize machine-based cables and chest-supported setups to maintain high mechanical tension with minimal stabilization torque.")
        elif goal == "strength":
            guidance_list.append("Goal Note: Avoid 1-rep maximum testing while discomfort is present. Prioritize submaximal controlled-tempo sets (RPE 6-7).")
        else:
            guidance_list.append("Goal Note: Prioritize joint mobility, functional core stability, and full-body movement quality.")

        # 4. Build Exercise Clearances
        clearances: List[ExerciseClearanceItem] = []
        for cl in rule_data.get("clearances", []):
            if caution_level == "high":
                st = cl["high_status"]
                re = cl["high_reason"]
            elif caution_level == "moderate":
                st = cl["mod_status"]
                re = cl["mod_reason"]
            else:
                st = cl["safe_status"]
                re = cl["safe_reason"]

            clearances.append(
                ExerciseClearanceItem(
                    name=cl["name"],
                    target=cl["target"],
                    status=st,
                    reason=re,
                    alternative=cl.get("alternative"),
                    benefit=cl.get("benefit")
                )
            )

        return InjuryAnalyzeResponse(
            caution_level=caution_level,
            avoid_or_modify=avoid_list,
            lower_impact_alternatives=alternatives_list,
            general_recommendations=guidance_list,
            medical_disclaimer=self.config.disclaimer,
            body_part=input_data.body_part,
            pain_level=pain_level,
            goal=input_data.goal,
            exercise_clearances=clearances
        )

    def save_profile(self, user_id: str, payload: InjuryProfileInput) -> InjuryProfileResponse:
        """
        Persists the user's selected injury concern and evaluates current precautions.
        """
        analyze_req = InjuryAnalyzeInput(
            body_part=payload.body_part,
            pain_level=payload.pain_level,
            pain_description=payload.pain_description,
            recent_injury=payload.recent_injury,
            goal=payload.goal
        )
        analysis = self.analyze_injury(analyze_req)

        profile_id = f"inj_{int(datetime.now().timestamp() * 1000)}"
        body_parts = payload.body_parts if payload.body_parts else [payload.body_part]

        profile_data = {
            "id": profile_id,
            "user_id": user_id,
            "body_part": payload.body_part,
            "body_parts": body_parts,
            "pain_level": payload.pain_level,
            "pain_description": payload.pain_description,
            "recent_injury": payload.recent_injury,
            "goal": payload.goal,
            "caution_level": analysis.caution_level,
            "analysis": analysis.model_dump(),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        # Save to dev in-memory store
        DEV_INJURY_PROFILES[user_id] = profile_data

        # Save to Supabase if configured
        supabase = get_supabase()
        if supabase and user_id != "usr_001":
            try:
                supabase.table("user_injury_profiles").upsert({
                    "user_id": user_id,
                    "body_part": payload.body_part,
                    "body_parts": body_parts,
                    "pain_level": payload.pain_level,
                    "pain_description": payload.pain_description,
                    "recent_injury": payload.recent_injury,
                    "goal": payload.goal,
                    "caution_level": analysis.caution_level,
                    "updated_at": datetime.now().isoformat()
                }, on_conflict="user_id").execute()
            except Exception as e:
                logger.warning(f"Could not persist injury profile to Supabase: {e}")

        return InjuryProfileResponse(
            id=profile_id,
            user_id=user_id,
            body_part=payload.body_part,
            body_parts=body_parts,
            pain_level=payload.pain_level,
            pain_description=payload.pain_description,
            recent_injury=payload.recent_injury,
            goal=payload.goal,
            caution_level=analysis.caution_level,
            analysis=analysis,
            created_at=datetime.fromisoformat(profile_data["created_at"]),
            updated_at=datetime.fromisoformat(profile_data["updated_at"])
        )

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves active stored injury profile for a user.
        """
        if user_id in DEV_INJURY_PROFILES:
            return DEV_INJURY_PROFILES[user_id]

        supabase = get_supabase()
        if supabase and user_id != "usr_001":
            try:
                res = (
                    supabase.table("user_injury_profiles")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("updated_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Could not load injury profile from Supabase: {e}")

        return None

    def get_recommendations(
        self,
        user_id: str,
        body_part: Optional[str] = None,
        pain_level: Optional[int] = None,
        goal: Optional[str] = None
    ) -> InjuryAnalyzeResponse:
        """
        Gets dynamic exercise recommendations based on active profile or explicit params.
        """
        profile = self.get_user_profile(user_id)
        effective_bp = body_part or (profile.get("body_part") if profile else "knee")
        effective_pain = pain_level if pain_level is not None else (profile.get("pain_level", 0) if profile else 0)
        effective_goal = goal or (profile.get("goal") if profile else "general_fitness")
        recent_inj = profile.get("recent_injury") if profile else None
        pain_desc = profile.get("pain_description") if profile else None

        req = InjuryAnalyzeInput(
            body_part=effective_bp,
            pain_level=effective_pain,
            pain_description=pain_desc,
            recent_injury=recent_inj,
            goal=effective_goal
        )
        return self.analyze_injury(req)

    def update_rule_config(self, new_config: InjuryRuleConfig):
        """
        Runtime configurable rules updater.
        """
        self.config = new_config


injury_safety_service = InjurySafetyService()
