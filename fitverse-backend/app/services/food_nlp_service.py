import re
from typing import List, Dict, Any, Optional, Tuple
from app.services.food_database import FOOD_DATABASE, lookup_food_item
from app.core.logging import logger

WORD_TO_NUM: Dict[str, float] = {
    "a": 1.0,
    "an": 1.0,
    "one": 1.0,
    "two": 2.0,
    "three": 3.0,
    "four": 4.0,
    "five": 5.0,
    "six": 6.0,
    "half": 0.5,
    "couple": 2.0,
}

MEAL_PATTERNS = {
    "Breakfast": [r"\bbreakfast\b", r"\bmorning\b"],
    "Lunch": [r"\blunch\b", r"\bafternoon\b"],
    "Dinner": [r"\bdinner\b", r"\bnight\b", r"\bsupper\b"],
    "Snack": [r"\bsnack\b", r"\bevening\b", r"\bpre-workout\b", r"\bpost-workout\b"],
}

UNIT_PATTERNS = [
    r"\b(bowl|bowls|katori|katoris)\b",
    r"\b(plate|plates)\b",
    r"\b(piece|pieces|slice|slices)\b",
    r"\b(cup|cups)\b",
    r"\b(glass|glasses)\b",
    r"\b(scoop|scoops)\b",
    r"\b(serving|servings)\b",
    r"\b(g|gm|gms|gram|grams)\b",
    r"\b(ml|milliliter|milliliters)\b",
]

class FoodNLPService:
    @staticmethod
    def detect_meal_type(text: str) -> Optional[str]:
        lower = text.lower()
        for meal, patterns in MEAL_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, lower):
                    return meal
        return None

    @classmethod
    def parse_quantity_and_unit(cls, chunk: str) -> Tuple[float, str, str, bool]:
        """
        Extracts quantity, unit, and remaining food query string from a chunk.
        Returns: (quantity, unit, clean_food_query, explicit_quantity_found)
        """
        clean = chunk.strip().lower()

        # Check for patterns like "100g", "250ml", "50gm"
        g_match = re.search(r"(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams)\b", clean)
        if g_match:
            qty = float(g_match.group(1))
            remaining = clean[:g_match.start()] + clean[g_match.end():]
            return qty, "g", remaining.strip(), True

        ml_match = re.search(r"(\d+(?:\.\d+)?)\s*(ml|milliliter|milliliters)\b", clean)
        if ml_match:
            qty = float(ml_match.group(1))
            remaining = clean[:ml_match.start()] + clean[ml_match.end():]
            return qty, "ml", remaining.strip(), True

        # Check numeric quantity + optional unit: e.g. "2 rotis", "1 bowl dal", "one banana"
        # 1. Numeric digit
        digit_match = re.search(r"\b(\d+(?:\.\d+)?)\b", clean)
        # 2. Word digit ("two", "one", "half")
        word_match = None
        if not digit_match:
            for word, val in WORD_TO_NUM.items():
                w_search = re.search(rf"\b{word}\b", clean)
                if w_search:
                    word_match = (val, w_search.group(0), w_search.start(), w_search.end())
                    break

        quantity = 1.0
        explicit_qty = False
        remaining = clean

        if digit_match:
            quantity = float(digit_match.group(1))
            explicit_qty = True
            remaining = clean[:digit_match.start()] + clean[digit_match.end():]
        elif word_match:
            quantity = word_match[0]
            explicit_qty = True
            remaining = clean[:word_match[2]] + clean[word_match[3]:]

        # Extract unit if present
        detected_unit = "serving"
        for unit_pat in UNIT_PATTERNS:
            u_search = re.search(unit_pat, remaining)
            if u_search:
                detected_unit = u_search.group(0).rstrip("s")
                remaining = remaining[:u_search.start()] + remaining[u_search.end():]
                break

        # Strip common stop words
        clean_food = re.sub(r"\b(i|ate|had|consumed|drank|ate|for|with|of|some|a|an)\b", " ", remaining)
        clean_food = re.sub(r"\s+", " ", clean_food).strip()

        return quantity, detected_unit, clean_food, explicit_qty

    @classmethod
    def analyze_natural_language(cls, text: str) -> Dict[str, Any]:
        """
        Parses a natural language meal description into discrete items,
        estimates nutrition values, calculates confidence, and checks ambiguity.
        """
        logger.info(f"Parsing natural language food text: '{text}'")
        detected_meal = cls.detect_meal_type(text) or "Breakfast"

        # Split multiple items using delimiters: "and", "with", ",", "+", "plus"
        # Clean out meal type markers first so they don't corrupt item splitting
        cleaned_text = re.sub(r"\b(for breakfast|for lunch|for dinner|for snack|in breakfast|in lunch|in dinner)\b", "", text, flags=re.IGNORECASE)
        chunks = re.split(r",|\band\b|\bwith\b|\bplus\b|\+", cleaned_text, flags=re.IGNORECASE)

        parsed_items: List[Dict[str, Any]] = []
        overall_needs_confirmation = False
        confirmation_prompts: List[str] = []

        for chunk in chunks:
            if not chunk or not chunk.strip():
                continue

            quantity, unit, food_query, explicit_qty = cls.parse_quantity_and_unit(chunk)
            if not food_query:
                continue

            match = lookup_food_item(food_query)

            if match:
                canonical = match["canonical_name"]
                cat_unit = match.get("default_unit", "serving")

                # Handle grams scaling (e.g. 100g paneer vs standard serving)
                if unit in ["g", "gm", "gram", "grams"] and match.get("default_unit") == "g":
                    multiplier = quantity / 100.0
                    actual_unit = "g"
                    actual_qty = quantity
                else:
                    multiplier = quantity
                    actual_unit = unit if unit != "serving" else cat_unit
                    actual_qty = quantity

                item_cal = round(match["calories"] * multiplier)
                item_pro = round(match["protein"] * multiplier, 1)
                item_carb = round(match["carbs"] * multiplier, 1)
                item_fat = round(match["fat"] * multiplier, 1)
                item_fiber = round(match["fiber"] * multiplier, 1)

                # Confidence calculation
                if explicit_qty:
                    confidence = 0.92
                    item_needs_conf = False
                    prompt = None
                else:
                    confidence = 0.70
                    item_needs_conf = True
                    prompt = f"Estimated 1 standard {actual_unit} of {canonical}. Adjust portion if needed."
                    confirmation_prompts.append(prompt)
                    overall_needs_confirmation = True

                parsed_items.append({
                    "name": canonical,
                    "quantity": actual_qty,
                    "unit": actual_unit,
                    "calories": item_cal,
                    "protein": item_pro,
                    "carbs": item_carb,
                    "fat": item_fat,
                    "fiber": item_fiber,
                    "confidence": confidence,
                    "needs_confirmation": item_needs_conf,
                    "notes": prompt or "Verified with FitVerse Nutrition Knowledge Base",
                })
            else:
                # Unrecognized food: return reasonable generic baseline + low confidence
                confidence = 0.40
                overall_needs_confirmation = True
                prompt = f"Uncertain portion for '{food_query.title()}'. Please confirm nutrition numbers."
                confirmation_prompts.append(prompt)

                parsed_items.append({
                    "name": food_query.strip().title(),
                    "quantity": quantity,
                    "unit": unit or "serving",
                    "calories": 250,
                    "protein": 10.0,
                    "carbs": 30.0,
                    "fat": 8.0,
                    "fiber": 2.0,
                    "confidence": confidence,
                    "needs_confirmation": True,
                    "notes": prompt,
                })

        # Calculate Totals
        total_cal = sum(item["calories"] for item in parsed_items)
        total_pro = round(sum(item["protein"] for item in parsed_items), 1)
        total_carb = round(sum(item["carbs"] for item in parsed_items), 1)
        total_fat = round(sum(item["fat"] for item in parsed_items), 1)
        total_fiber = round(sum(item["fiber"] for item in parsed_items), 1)

        return {
            "success": True,
            "detected_meal_type": detected_meal,
            "foods": parsed_items,
            "total": {
                "calories": total_cal,
                "protein": total_pro,
                "carbs": total_carb,
                "fat": total_fat,
                "fiber": total_fiber,
            },
            "needs_confirmation": overall_needs_confirmation,
            "confirmation_prompt": " • ".join(confirmation_prompts) if confirmation_prompts else None,
            "disclaimer": "Nutritional values are scientific estimates based on standard portion weights."
        }

food_nlp_service = FoodNLPService()
