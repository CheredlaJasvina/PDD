"""
FoodFreshness AI Classifier — v2.0
Primary:  PyTorch MobileNetV3-Small (ImageNet pre-trained) — the AI label is the TRUTH.
Cross-val: Pixel colour analysis is used ONLY to:
           1. Estimate freshness / decay percentage for the detected food
           2. Detect human faces / skin tones and reject them
           3. Sanity-check colour against the AI label (e.g. AI=apple but image is white → reject)
Confidence: If the top-1 probability < MIN_CONFIDENCE the scan is rejected.
Fallback:  Pure colour analysis when PyTorch is unavailable.
"""

import sys
import json
import os
import math
from PIL import Image


# ── Minimum confidence to accept an AI prediction ──────────────────────────
MIN_CONFIDENCE = 0.22   # 22 %  (ImageNet is 1000 classes — 30 % is already high)

# ── Comprehensive food knowledge base ───────────────────────────────────────
# key  = substring matched against ImageNet class label (lowercase)
# val  = (display_name, category, shelf_life_days, storage_guidance, safety_note,
#          expected_dominant_hue_range_or_None)
#   hue_range = (hue_min, hue_max) in 0-360 HSV degrees, None = no colour check

FOOD_DB = {
    # ── FRUITS ────────────────────────────────────────────────────────
    "granny smith":      ("Green Apple",          "fruits",        10, "Refrigerate or keep cool. Keep away from bananas.",                  "Safe to eat.",           (80, 160)),
    "apple":             ("Red Apple",             "fruits",        10, "Store at 4 °C. Keep separated from leafy vegetables.",              "Safe to eat.",           None),
    "banana":            ("Banana",                "fruits",         5, "Hang at room temp. Wrap tips to slow ripening.",                    "Fresh and nutritious.",  (30, 65)),
    "orange":            ("Orange",                "fruits",        14, "Store at room temperature or refrigerate.",                         "Rich in Vitamin C.",     (15, 40)),
    "lemon":             ("Lemon",                 "fruits",        21, "Keep in fridge crisper. Slice only when needed.",                   "High citric acid.",      (40, 70)),
    "lime":              ("Lime",                  "fruits",        14, "Refrigerate in a zip-lock bag.",                                    "Safe to eat.",           (70, 130)),
    "strawberry":        ("Strawberries",          "fruits",         4, "Refrigerate unwashed. Wash just before eating.",                    "Safe to eat.",           (330, 360)),
    "pineapple":         ("Pineapple",             "fruits",         5, "Refrigerate cut pineapple. Store whole at room temp.",              "Rich in Vitamin C.",     (35, 70)),
    "mango":             ("Mango",                 "fruits",         7, "Ripen at room temp, then refrigerate.",                             "Safe to eat.",           (15, 55)),
    "pomegranate":       ("Pomegranate",           "fruits",        60, "Store at room temp for 1 week or refrigerate up to 2 months.",      "High in antioxidants.",  (330, 360)),
    "grape":             ("Grapes",                "fruits",         7, "Refrigerate unwashed. Wash just before eating.",                    "Safe to eat.",           None),
    "watermelon":        ("Watermelon",            "fruits",        14, "Refrigerate cut pieces. Store whole at room temp.",                 "Hydrating and fresh.",   (330, 360)),
    "cantaloupe":        ("Cantaloupe",            "fruits",         5, "Refrigerate cut melon. Store whole at room temp.",                  "Safe to eat.",           (20, 50)),
    "honeydew":          ("Honeydew Melon",        "fruits",         5, "Refrigerate once cut.",                                             "Safe to eat.",           (60, 130)),
    "fig":               ("Figs",                  "fruits",         3, "Refrigerate immediately. Very perishable.",                         "Safe to eat.",           (330, 360)),
    "peach":             ("Peach",                 "fruits",         5, "Ripen at room temp, then refrigerate.",                             "Safe to eat.",           (15, 40)),
    "pear":              ("Pear",                  "fruits",         7, "Ripen at room temp, then refrigerate.",                             "Safe to eat.",           (55, 120)),
    "plum":              ("Plum",                  "fruits",         7, "Refrigerate when ripe.",                                            "Safe to eat.",           (280, 360)),
    "cherry":            ("Cherries",              "fruits",         7, "Refrigerate unwashed.",                                             "Safe to eat.",           (330, 360)),
    "kiwi":              ("Kiwi",                  "fruits",         7, "Ripen at room temp, then refrigerate.",                             "Rich in Vitamin C.",     (60, 110)),
    "papaya":            ("Papaya",                "fruits",         5, "Ripen at room temp. Refrigerate once ripe.",                        "Safe to eat.",           (20, 50)),
    "avocado":           ("Avocado",               "fruits",         4, "Ripen at room temp. Refrigerate once ripe.",                        "Healthy fats.",          (70, 140)),
    "coconut":           ("Coconut",               "fruits",        60, "Store whole at room temp. Refrigerate opened coconut.",             "Safe to eat.",           None),
    "jackfruit":         ("Jackfruit",             "fruits",         3, "Refrigerate cut jackfruit.",                                        "Safe to eat.",           (40, 70)),
    "blueberry":         ("Blueberries",           "fruits",         7, "Refrigerate unwashed.",                                             "High antioxidants.",     (200, 280)),
    "raspberry":         ("Raspberries",           "fruits",         3, "Refrigerate. Very perishable.",                                     "Safe to eat.",           (330, 360)),
    "blackberry":        ("Blackberries",          "fruits",        3,  "Refrigerate. Very perishable.",                                     "Safe to eat.",           (260, 320)),
    "gooseberry":        ("Gooseberries",          "fruits",         5, "Refrigerate.",                                                      "Safe to eat.",           (60, 140)),
    "guava":             ("Guava",                 "fruits",         5, "Ripen at room temp, refrigerate when ripe.",                        "Rich in Vitamin C.",     (55, 110)),

    # ── VEGETABLES ────────────────────────────────────────────────────
    "broccoli":          ("Broccoli",              "vegetables",     5, "Refrigerate in crisper. Use within 5 days.",                        "Safe to eat.",           (80, 160)),
    "cauliflower":       ("Cauliflower",           "vegetables",     7, "Refrigerate in a plastic bag.",                                     "Safe to eat.",           None),
    "cabbage":           ("Cabbage",               "vegetables",    14, "Refrigerate. Outer leaves protect inner ones.",                     "Safe to eat.",           (80, 160)),
    "spinach":           ("Spinach",               "vegetables",     4, "Refrigerate in dry container. Moisture wilts it fast.",             "Safe to eat.",           (90, 155)),
    "lettuce":           ("Lettuce",               "vegetables",     5, "Refrigerate. Keep dry.",                                            "Wash before eating.",    (80, 155)),
    "kale":              ("Kale",                  "vegetables",     5, "Refrigerate. Wrap in damp paper towel.",                            "Rich in Vitamin K.",     (80, 160)),
    "cucumber":          ("Cucumber",              "vegetables",     7, "Refrigerate. Keep away from ethylene-producing fruits.",            "Safe to eat.",           (80, 155)),
    "zucchini":          ("Zucchini",              "vegetables",     5, "Refrigerate. Do not freeze raw.",                                   "Safe to eat.",           (80, 145)),
    "carrot":            ("Carrots",               "vegetables",    21, "Refrigerate in water. Remove tops.",                                "High in Vitamin A.",     (15, 35)),
    "bell pepper":       ("Bell Pepper",           "vegetables",     7, "Refrigerate in crisper.",                                           "Rich in Vitamin C.",     None),
    "capsicum":          ("Capsicum",              "vegetables",     7, "Refrigerate in crisper.",                                           "Rich in Vitamin C.",     None),
    "chili":             ("Chili Pepper",          "vegetables",    14, "Refrigerate or dry for longer shelf life.",                         "Handle with care.",      (330, 360)),
    "jalapeno":          ("Jalapeño",              "vegetables",    14, "Refrigerate.",                                                      "Spicy — handle carefully.", (80, 140)),
    "tomato":            ("Tomato",                "vegetables",     7, "Store at room temp. Refrigerating kills flavour.",                  "Safe to eat.",           (330, 360)),
    "potato":            ("Potato",                "vegetables",    60, "Store in a cool dark place. Not the fridge.",                       "Safe to eat.",           None),
    "sweet potato":      ("Sweet Potato",          "vegetables",    30, "Store in a cool dark place. Not the fridge.",                       "High in Vitamin A.",     (15, 40)),
    "onion":             ("Onion",                 "vegetables",    30, "Store in a cool dark dry place.",                                   "Safe to eat.",           None),
    "garlic":            ("Garlic",                "vegetables",    90, "Store in a cool dry place. Do not refrigerate.",                    "Safe to eat.",           None),
    "corn":              ("Corn",                  "vegetables",     3, "Refrigerate. Eat within 1-2 days for best flavour.",                "High in fibre.",         (45, 70)),
    "pea":               ("Peas",                  "vegetables",     3, "Refrigerate or freeze promptly.",                                   "Safe to eat.",           (90, 155)),
    "bean":              ("Green Beans",           "vegetables",     5, "Refrigerate in a bag.",                                             "Safe to eat.",           (80, 150)),
    "asparagus":         ("Asparagus",             "vegetables",     4, "Stand upright in water in the fridge.",                             "Safe to eat.",           (80, 155)),
    "celery":            ("Celery",                "vegetables",    14, "Refrigerate. Wrap in foil to stay crisp.",                          "Safe to eat.",           (80, 150)),
    "eggplant":          ("Eggplant",              "vegetables",     5, "Store at room temp for 1-2 days, then refrigerate.",                "Safe to eat.",           (270, 320)),
    "artichoke":         ("Artichoke",             "vegetables",     5, "Refrigerate in damp paper towel.",                                  "Safe to eat.",           (80, 150)),
    "beetroot":          ("Beetroot",              "vegetables",    14, "Refrigerate. Keeps well.",                                          "High in iron.",          (330, 360)),
    "radish":            ("Radish",                "vegetables",    14, "Refrigerate. Remove tops.",                                         "Safe to eat.",           (330, 360)),
    "leek":              ("Leek",                  "vegetables",     7, "Refrigerate loosely wrapped.",                                      "Safe to eat.",           (80, 145)),
    "mushroom":          ("Mushrooms",             "vegetables",     5, "Refrigerate in paper bag. Avoid plastic.",                          "Safe to eat.",           None),
    "ginger":            ("Ginger",                "vegetables",    30, "Refrigerate or freeze peeled ginger.",                              "Anti-inflammatory.",     (25, 50)),
    "pumpkin":           ("Pumpkin",               "vegetables",    90, "Store whole in cool dry place. Refrigerate cut pumpkin.",           "High in Vitamin A.",     (20, 50)),
    "squash":            ("Butternut Squash",      "vegetables",    30, "Store in cool dry place.",                                          "Safe to eat.",           (25, 50)),

    # ── COOKED / PACKAGED FOOD ────────────────────────────────────────
    "hotdog":            ("Hotdog",                "cooked food",    2, "Refrigerate immediately. Eat within 2 days.",                       "Consume promptly.",      None),
    "cheeseburger":      ("Cheeseburger",          "cooked food",    1, "Consume same day. Refrigerate if storing.",                         "Consume within hours.",  None),
    "burger":            ("Burger",                "cooked food",    1, "Consume same day.",                                                 "Consume within hours.",  None),
    "pizza":             ("Pizza",                 "cooked food",    2, "Refrigerate. Consume within 2 days.",                               "Reheat before eating.",  None),
    "sandwich":          ("Sandwich",              "cooked food",    1, "Consume same day. Refrigerate if storing.",                         "Consume promptly.",      None),
    "spaghetti":         ("Spaghetti",             "cooked food",    2, "Refrigerate in airtight container.",                               "Consume within 2 days.", None),
    "pasta":             ("Pasta",                 "cooked food",    2, "Refrigerate in airtight container.",                               "Consume within 2 days.", None),
    "rice":              ("Cooked Rice",           "cooked food",    1, "Refrigerate immediately. Never leave at room temp.",                "WARNING: Reheat only once.", None),
    "fried rice":        ("Fried Rice",            "cooked food",    1, "Refrigerate immediately. Never leave at room temp.",                "WARNING: Reheat only once.", None),
    "soup":              ("Soup",                  "cooked food",    2, "Refrigerate in airtight container.",                               "Reheat thoroughly.",     None),
    "stew":              ("Stew",                  "cooked food",    2, "Refrigerate in airtight container.",                               "Reheat thoroughly.",     None),
    "curry":             ("Curry",                 "cooked food",    2, "Refrigerate. Reheat to 75 °C.",                                    "Consume within 2 days.", None),
    "omelette":          ("Omelette",              "cooked food",    1, "Consume immediately or refrigerate.",                              "Consume same day.",      None),
    "bread":             ("Bread",                 "packaged food",  5, "Store in bread bag at room temp. Freeze for longer.",              "Safe to eat.",           None),
    "cake":              ("Cake",                  "cooked food",    3, "Refrigerate cream/fruit cakes. Room temp for plain.",              "Consume within 3 days.", None),
    "cookie":            ("Cookies",               "packaged food", 14, "Store in airtight container at room temperature.",                 "Safe to eat.",           None),
    "chocolate":         ("Chocolate",             "packaged food", 90, "Store in a cool dry place. Avoid moisture.",                       "Safe to eat.",           None),
    "yogurt":            ("Yogurt",                "packaged food",  7, "Refrigerate at all times.",                                        "Check expiry date.",     None),
    "cheese":            ("Cheese",                "packaged food", 14, "Wrap in wax paper. Refrigerate in drawer.",                        "Check for mould.",       None),
    "milk":              ("Milk",                  "packaged food",  3, "Refrigerate below 4 °C. Keep tightly sealed.",                     "Check expiry date.",     None),
    "butter":            ("Butter",                "packaged food", 30, "Refrigerate. Can be left at room temp for short periods.",         "Safe to eat.",           None),
    "egg":               ("Eggs",                  "packaged food", 21, "Refrigerate. Do not wash until use.",                              "Cook thoroughly.",       None),
    "ice cream":         ("Ice Cream",             "packaged food", 60, "Keep frozen at all times.",                                        "Consume once thawed.",   None),
}


def rgb_to_hsv(r, g, b):
    """Convert RGB (0-255) to HSV (H: 0-360, S: 0-1, V: 0-1)."""
    r_, g_, b_ = r / 255.0, g / 255.0, b / 255.0
    mx = max(r_, g_, b_)
    mn = min(r_, g_, b_)
    diff = mx - mn
    v = mx
    s = (diff / mx) if mx > 0 else 0.0
    h = 0.0
    if diff > 0:
        if mx == r_:
            h = (g_ - b_) / diff
        elif mx == g_:
            h = 2.0 + (b_ - r_) / diff
        else:
            h = 4.0 + (r_ - g_) / diff
        h = (h * 60.0) % 360.0
    return h, s, v


def analyse_pixels(img_path):
    """
    Returns a pixel stats dict used for:
      - Skin-tone / face rejection
      - Freshness / decay estimation
      - Colour cross-validation
    """
    try:
        img = Image.open(img_path).convert('RGB')
        img = img.resize((150, 150))
    except Exception as e:
        return None, f"Cannot open image: {e}"

    w, h = img.size
    total = w * h

    counts = {
        "skin": 0, "green": 0, "red": 0, "yellow": 0,
        "orange": 0, "purple": 0, "white": 0, "brown_rot": 0,
        "dark": 0, "neutral": 0
    }

    for x in range(w):
        for y in range(h):
            r, g, b = img.getpixel((x, y))
            hue, sat, val = rgb_to_hsv(r, g, b)

            # ── Skin tone (face rejection) ─────────────────────────────
            if 0 <= hue <= 50 and 0.20 <= sat <= 0.75 and val > 0.35:
                counts["skin"] += 1

            # ── Low-saturation pixels (white / grey / packaged) ────────
            if sat < 0.12:
                if val > 0.75:
                    counts["white"] += 1
                elif val < 0.25:
                    counts["dark"] += 1
                else:
                    counts["neutral"] += 1
                continue  # skip hue bins for desaturated pixels

            # ── Hue bins ───────────────────────────────────────────────
            if 80 <= hue <= 165:               # Green → vegetables / unripe
                counts["green"] += 1
            elif (hue >= 345 or hue <= 12) and val > 0.3:  # Red
                counts["red"] += 1
            elif 12 < hue <= 30 and val > 0.3: # Orange
                counts["orange"] += 1
            elif 30 < hue <= 70 and val > 0.3: # Yellow
                counts["yellow"] += 1
            elif 230 <= hue <= 310:            # Purple / violet
                counts["purple"] += 1

            # ── Brown rot / dark organic spots ─────────────────────────
            if 15 <= hue <= 45 and 0.25 <= sat <= 0.65 and val < 0.40:
                counts["brown_rot"] += 1

    stats = {k: v / total for k, v in counts.items()}  # normalise to 0-1
    stats["_total"] = total
    return stats, None


def estimate_freshness(stats, food_key, category):
    """
    Calculates a freshness percentage (0-100) for the detected food
    based on the brown-rot ratio and the food's own colour distribution.
    """
    if stats is None:
        return 85  # safe default

    rot = stats["brown_rot"]
    dark = stats["dark"]
    decay_signal = rot + dark * 0.4   # weighted decay proxy

    if category == "fruits":
        dominant = max(stats["red"], stats["green"], stats["yellow"], stats["orange"])
        if dominant < 0.06:           # very little colour → might be starting to brown
            decay_signal += 0.05
        freshness = max(5,  int(100 - decay_signal * 280))

    elif category == "vegetables":
        green_ratio = stats["green"]
        if green_ratio < 0.04 and "cauliflower" not in food_key and \
           "potato" not in food_key and "onion" not in food_key and \
           "garlic" not in food_key and "mushroom" not in food_key:
            decay_signal += 0.06      # yellowing / wilting vegetables
        freshness = max(5,  int(100 - decay_signal * 260))

    elif category == "cooked food":
        freshness = max(10, int(85  - decay_signal * 300))

    else:  # packaged
        freshness = max(50, int(95  - decay_signal * 200))

    return min(freshness, 100)


def colour_cross_validate(stats, food_key, ai_label):
    """
    Returns (valid: bool, reason: str).
    Checks whether the image colours are plausible for the AI's prediction.
    Only fires for cases where a colour mismatch is a strong signal of a wrong label.
    """
    if stats is None:
        return True, ""

    white_ratio = stats["white"] + stats["neutral"]
    green_ratio = stats["green"]
    red_ratio   = stats["red"]
    yellow_ratio = stats["yellow"]

    # ── Apple / red fruit claimed but image is mostly white / pale ────
    if any(k in food_key for k in ("apple", "strawberry", "tomato", "cherry",
                                    "raspberry", "pomegranate", "beetroot", "plum")):
        # Expect reds or greens, but image is overwhelmingly white/grey
        if white_ratio > 0.65 and red_ratio < 0.04 and green_ratio < 0.04:
            return False, (
                f"Colour mismatch: AI predicted '{ai_label}' but image is predominantly "
                f"white/pale ({white_ratio*100:.0f}% white pixels). "
                "Likely a white vegetable like cauliflower. Please re-scan."
            )

    # ── Green vegetables claimed but image is clearly red/orange ──────
    if any(k in food_key for k in ("broccoli", "spinach", "lettuce", "cucumber",
                                    "celery", "kale", "pea", "zucchini")):
        if red_ratio > 0.45 and green_ratio < 0.08:
            return False, (
                f"Colour mismatch: AI predicted '{ai_label}' but image has heavy red "
                f"tones ({red_ratio*100:.0f}% red). Please re-scan."
            )

    # ── Banana / yellow fruit but image is green or red ───────────────
    if "banana" in food_key:
        if red_ratio > 0.35 and yellow_ratio < 0.05:
            return False, (
                "Colour mismatch: AI predicted 'Banana' but image is predominantly red. "
                "Please re-scan."
            )

    return True, ""


def run_deep_learning_classification(img_path):
    """
    Primary classifier using PyTorch MobileNetV3-Small.
    The AI label is the ground truth — colour is only used for freshness + validation.
    Falls back to colour-only analysis when PyTorch is unavailable.
    """
    try:
        import torch
        import torchvision.transforms as transforms

        script_dir  = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(script_dir)

        # ── 1. Try custom-trained checkpoint first ─────────────────────
        custom_model_path = os.path.join(backend_dir, 'models', 'freshness_model.pth')
        if os.path.exists(custom_model_path):
            try:
                checkpoint = torch.load(custom_model_path, map_location='cpu')
                from torchvision.models import resnet18
                model = resnet18()
                num_classes = len(checkpoint['classes'])
                model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
                model.load_state_dict(checkpoint['model_state'])
                model.eval()
                preprocess = transforms.Compose([
                    transforms.Resize((128, 128)),
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
                ])
                img = Image.open(img_path).convert('RGB')
                tensor = preprocess(img).unsqueeze(0)
                with torch.no_grad():
                    out = model(tensor)
                probs = torch.nn.functional.softmax(out[0], dim=0)
                top_prob, top_id = torch.topk(probs, 1)
                confidence = top_prob[0].item()
                predicted_class = checkpoint['classes'][top_id[0].item()].lower()

                if confidence < MIN_CONFIDENCE:
                    return {
                        "success": False,
                        "message": (
                            f"Low AI confidence ({confidence*100:.1f}%). "
                            "The image is unclear or does not contain a recognisable food item. "
                            "Try better lighting or a closer shot."
                        )
                    }

                # Map custom checkpoint label to FOOD_DB
                matched_key = None
                for key in FOOD_DB:
                    if key in predicted_class:
                        matched_key = key
                        break

                if matched_key:
                    return _build_result(matched_key, img_path, confidence)
            except Exception:
                pass  # fall through to MobileNetV3

        # ── 2. Pre-trained MobileNetV3-Large (ImageNet) ─────────────
        from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights
        weights = MobileNet_V3_Large_Weights.DEFAULT
        model   = mobilenet_v3_large(weights=weights)
        model.eval()

        img = Image.open(img_path).convert('RGB')
        input_tensor = weights.transforms()(img).unsqueeze(0)

        with torch.no_grad():
            output = model(input_tensor)

        probs = torch.nn.functional.softmax(output[0], dim=0)

        # Grab top-5 predictions
        top_probs, top_ids = torch.topk(probs, 5)
        categories_list    = weights.meta["categories"]

        top5 = [
            (categories_list[top_ids[i].item()].lower(), top_probs[i].item())
            for i in range(5)
        ]

        top_label, top_confidence = top5[0]

        # ── 2a. Skin / face rejection ──────────────────────────────
        face_keywords = ["face", "mask", "wig", "hair", "person", "man", "woman",
                         "neck", "forehead", "chin"]
        if any(k in top_label for k in face_keywords):
            return {
                "success": False,
                "message": "Non-food item detected (human face/person). Scanner accepts food only."
            }

        # ── 2b. Try to match top-5 against FOOD_DB ─────────────────
        matched_key  = None
        matched_conf = 0.0
        for label, conf in top5:
            for key in FOOD_DB:
                if key in label:
                    matched_key  = key
                    matched_conf = conf
                    break
            if matched_key:
                break

        # ── 2c. Confidence gate ────────────────────────────────────
        if matched_key is None:
            # Check if ANY top-5 label looks like food at all
            generic_food_words = [
                "food", "fruit", "vegetable", "veg", "produce", "dish", "meal",
                "plate", "bowl", "soup", "salad", "bread", "bun", "roll",
                "meat", "fish", "chicken", "pork", "beef", "shrimp", "seafood",
                "egg", "cheese", "dairy", "milk", "butter", "cream",
                "cake", "pie", "cookie", "pastry", "dessert", "chocolate",
                "drink", "juice", "beverage",
            ]
            any_food = any(
                any(gw in lbl for gw in generic_food_words)
                for lbl, _ in top5
            )
            if not any_food:
                return {
                    "success": False,
                    "message": (
                        f"Non-food item detected ('{top_label}'). "
                        "Please scan a fruit, vegetable, cooked dish, or packaged food."
                    )
                }
            # It looks like food but we don't have a specific entry → use top label
            # as display name and default to packaged food
            return _build_generic_result(top_label, top_confidence, img_path)

        if matched_conf < MIN_CONFIDENCE:
            return {
                "success": False,
                "message": (
                    f"Low AI confidence ({matched_conf*100:.1f}%) for '{FOOD_DB[matched_key][0]}'. "
                    "Try better lighting, remove background clutter, or use Manual Entry."
                )
            }

        return _build_result(matched_key, img_path, matched_conf)

    except ImportError:
        # PyTorch not available — fall back to colour analysis
        return _colour_only_fallback(img_path)

    except Exception as e:
        return _colour_only_fallback(img_path)


def _build_result(food_key, img_path, confidence):
    """Build the final JSON result dict for a known food key."""
    name, category, shelf_life, guidance, safety, _ = FOOD_DB[food_key]

    # Pixel analysis for freshness + cross-validation
    stats, err = analyse_pixels(img_path)

    if stats is not None:
        # Face rejection via pixels (belt-and-suspenders)
        skin_pct = stats["skin"] * 100
        if skin_pct > 38:
            return {
                "success": False,
                "message": f"Non-food item detected (skin/face signature {skin_pct:.0f}%). Scanner accepts food only."
            }

        # Colour cross-validation
        valid, reason = colour_cross_validate(stats, food_key, name)
        if not valid:
            return {"success": False, "message": reason}

    freshness = estimate_freshness(stats, food_key, category)

    status = "Fresh"
    if freshness < 35:
        status = "Spoiled"
        safety = f"WARNING: Item shows decay signs. {safety}"
    elif freshness < 70:
        status = "Slightly Spoiled"

    return {
        "success":         True,
        "name":            name,
        "category":        category,
        "status":          status,
        "originalFreshness": freshness,
        "storageGuidance": guidance,
        "safetyAdvisory":  safety,
        "confidence":      round(confidence * 100, 1)
    }


def _build_generic_result(ai_label, confidence, img_path):
    """Fallback for food items recognised by AI but not in FOOD_DB."""
    stats, _ = analyse_pixels(img_path)

    if stats:
        skin_pct = stats["skin"] * 100
        if skin_pct > 38:
            return {
                "success": False,
                "message": f"Non-food item detected (skin/face signature {skin_pct:.0f}%)."
            }

    # Guess category from label
    veg_words = ["vegetable","veg","broccoli","spinach","lettuce","kale","cabbage","carrot"]
    fruit_words = ["fruit","apple","banana","orange","berry","mango","pineapple","melon"]
    cooked_words = ["soup","stew","rice","pasta","dish","meal","plate","pizza","burger","fried"]

    label_l = ai_label.lower()
    if any(w in label_l for w in cooked_words):
        category, shelf_life = "cooked food", 2
    elif any(w in label_l for w in fruit_words):
        category, shelf_life = "fruits", 7
    elif any(w in label_l for w in veg_words):
        category, shelf_life = "vegetables", 5
    else:
        category, shelf_life = "packaged food", 7

    freshness = estimate_freshness(stats, ai_label, category)
    status = "Fresh" if freshness >= 70 else ("Slightly Spoiled" if freshness >= 35 else "Spoiled")
    display_name = " ".join(w.capitalize() for w in ai_label.split()[:3])

    return {
        "success":         True,
        "name":            display_name,
        "category":        category,
        "status":          status,
        "originalFreshness": freshness,
        "storageGuidance": "Store appropriately based on food type.",
        "safetyAdvisory":  "Safe to eat." if freshness >= 35 else "WARNING: Possible spoilage detected.",
        "confidence":      round(confidence * 100, 1)
    }


def _colour_only_fallback(img_path):
    """
    Pure colour analysis — used only when PyTorch is not installed.
    More conservative than before: requires stronger colour signal.
    """
    stats, err = analyse_pixels(img_path)
    if stats is None:
        return {"success": False, "message": err or "Cannot analyse image."}

    skin_pct = stats["skin"] * 100
    if skin_pct > 38:
        return {
            "success": False,
            "message": f"Non-food item detected (skin/face {skin_pct:.0f}%)."
        }

    g = stats["green"]
    r = stats["red"] + stats["orange"] * 0.5
    y = stats["yellow"]
    total_colour = g + r + y

    # Require a minimum colour signal — reject bland/ambiguous images
    if total_colour < 0.08:
        return {
            "success": False,
            "message": (
                "Scan Rejected: Image does not contain enough colour to identify food. "
                "PyTorch is required for accurate identification. "
                "Use Manual Entry instead."
            )
        }

    if g > r and g > y and g > 0.08:
        key = "broccoli"
    elif r > g and r > y and r > 0.08:
        key = "tomato"
    elif y > g and y > r and y > 0.08:
        key = "banana"
    else:
        return {
            "success": False,
            "message": (
                "Colour analysis inconclusive. Install PyTorch for accurate AI scanning, "
                "or use Manual Entry."
            )
        }

    return _build_result(key, img_path, 0.60)


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "No image path provided."}))
        sys.exit(1)

    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(json.dumps({"success": False, "message": f"File not found: {img_path}"}))
        sys.exit(1)

    result = run_deep_learning_classification(img_path)
    print(json.dumps(result))
