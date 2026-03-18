"""
50+ Indian foods with accurate macro data per 100g.
Sources: ICMR NIN food composition tables + USDA FoodData.
"""

FOODS = [
    # ── Grains ────────────────────────────────────────────────────────────────
    {"name": "White Rice (cooked)", "category": "grain", "calories_per_100g": 130, "protein_per_100g": 2.7, "carbs_per_100g": 28.2, "fat_per_100g": 0.3, "fiber_per_100g": 0.4, "serving_size_g": 150, "serving_label": "1 cup"},
    {"name": "Brown Rice (cooked)", "category": "grain", "calories_per_100g": 123, "protein_per_100g": 2.6, "carbs_per_100g": 25.6, "fat_per_100g": 0.9, "fiber_per_100g": 1.8, "serving_size_g": 150, "serving_label": "1 cup"},
    {"name": "Whole Wheat Roti", "category": "grain", "calories_per_100g": 264, "protein_per_100g": 8.0, "carbs_per_100g": 52.0, "fat_per_100g": 3.5, "fiber_per_100g": 4.6, "serving_size_g": 40, "serving_label": "1 roti"},
    {"name": "Maida Roti / Naan", "category": "grain", "calories_per_100g": 300, "protein_per_100g": 9.0, "carbs_per_100g": 58.0, "fat_per_100g": 4.0, "fiber_per_100g": 1.2, "serving_size_g": 90, "serving_label": "1 naan"},
    {"name": "Poha (cooked)", "category": "grain", "calories_per_100g": 110, "protein_per_100g": 2.5, "carbs_per_100g": 22.0, "fat_per_100g": 1.5, "fiber_per_100g": 0.8, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Upma (cooked)", "category": "grain", "calories_per_100g": 105, "protein_per_100g": 2.8, "carbs_per_100g": 18.0, "fat_per_100g": 2.5, "fiber_per_100g": 1.0, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Idli (steamed)", "category": "grain", "calories_per_100g": 58, "protein_per_100g": 2.0, "carbs_per_100g": 11.6, "fat_per_100g": 0.4, "fiber_per_100g": 0.5, "serving_size_g": 60, "serving_label": "1 idli"},
    {"name": "Dosa (plain)", "category": "grain", "calories_per_100g": 133, "protein_per_100g": 3.9, "carbs_per_100g": 23.0, "fat_per_100g": 3.0, "fiber_per_100g": 0.8, "serving_size_g": 100, "serving_label": "1 dosa"},
    {"name": "Paratha (plain, oil)", "category": "grain", "calories_per_100g": 260, "protein_per_100g": 6.5, "carbs_per_100g": 40.0, "fat_per_100g": 8.5, "fiber_per_100g": 3.5, "serving_size_g": 80, "serving_label": "1 paratha"},
    {"name": "Jowar Roti (Bhakri)", "category": "grain", "calories_per_100g": 250, "protein_per_100g": 8.5, "carbs_per_100g": 48.0, "fat_per_100g": 2.0, "fiber_per_100g": 6.0, "serving_size_g": 45, "serving_label": "1 bhakri"},
    {"name": "Bajra Roti", "category": "grain", "calories_per_100g": 260, "protein_per_100g": 9.0, "carbs_per_100g": 46.0, "fat_per_100g": 4.0, "fiber_per_100g": 5.0, "serving_size_g": 45, "serving_label": "1 roti"},
    {"name": "Oats (cooked)", "category": "grain", "calories_per_100g": 68, "protein_per_100g": 2.4, "carbs_per_100g": 12.0, "fat_per_100g": 1.4, "fiber_per_100g": 1.7, "serving_size_g": 240, "serving_label": "1 bowl"},

    # ── Lentils & Legumes ─────────────────────────────────────────────────────
    {"name": "Toor Dal (cooked)", "category": "protein", "calories_per_100g": 116, "protein_per_100g": 7.0, "carbs_per_100g": 20.0, "fat_per_100g": 0.4, "fiber_per_100g": 3.5, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Moong Dal (cooked)", "category": "protein", "calories_per_100g": 105, "protein_per_100g": 7.2, "carbs_per_100g": 18.5, "fat_per_100g": 0.4, "fiber_per_100g": 4.1, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Masoor Dal (cooked)", "category": "protein", "calories_per_100g": 116, "protein_per_100g": 9.0, "carbs_per_100g": 20.0, "fat_per_100g": 0.4, "fiber_per_100g": 4.0, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Chana Dal (cooked)", "category": "protein", "calories_per_100g": 164, "protein_per_100g": 8.9, "carbs_per_100g": 27.2, "fat_per_100g": 2.7, "fiber_per_100g": 6.8, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Rajma (cooked)", "category": "protein", "calories_per_100g": 127, "protein_per_100g": 8.7, "carbs_per_100g": 22.8, "fat_per_100g": 0.5, "fiber_per_100g": 6.4, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Chole / Chickpea (cooked)", "category": "protein", "calories_per_100g": 164, "protein_per_100g": 8.9, "carbs_per_100g": 27.4, "fat_per_100g": 2.6, "fiber_per_100g": 7.6, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Sprouted Moong", "category": "protein", "calories_per_100g": 30, "protein_per_100g": 3.0, "carbs_per_100g": 5.9, "fat_per_100g": 0.2, "fiber_per_100g": 1.8, "serving_size_g": 100, "serving_label": "1 cup"},

    # ── Protein (Non-veg) ─────────────────────────────────────────────────────
    {"name": "Chicken Breast (cooked)", "category": "protein", "calories_per_100g": 165, "protein_per_100g": 31.0, "carbs_per_100g": 0.0, "fat_per_100g": 3.6, "fiber_per_100g": 0.0, "serving_size_g": 150, "serving_label": "1 medium piece"},
    {"name": "Egg (whole, boiled)", "category": "protein", "calories_per_100g": 155, "protein_per_100g": 13.0, "carbs_per_100g": 1.1, "fat_per_100g": 11.0, "fiber_per_100g": 0.0, "serving_size_g": 50, "serving_label": "1 egg"},
    {"name": "Egg White (boiled)", "category": "protein", "calories_per_100g": 52, "protein_per_100g": 11.0, "carbs_per_100g": 0.7, "fat_per_100g": 0.2, "fiber_per_100g": 0.0, "serving_size_g": 33, "serving_label": "1 egg white"},
    {"name": "Fish (Rohu, cooked)", "category": "protein", "calories_per_100g": 97, "protein_per_100g": 17.0, "carbs_per_100g": 0.0, "fat_per_100g": 3.0, "fiber_per_100g": 0.0, "serving_size_g": 150, "serving_label": "1 piece"},
    {"name": "Mutton (cooked)", "category": "protein", "calories_per_100g": 263, "protein_per_100g": 25.6, "carbs_per_100g": 0.0, "fat_per_100g": 17.0, "fiber_per_100g": 0.0, "serving_size_g": 150, "serving_label": "1 serving"},
    {"name": "Tuna (canned in water)", "category": "protein", "calories_per_100g": 116, "protein_per_100g": 26.0, "carbs_per_100g": 0.0, "fat_per_100g": 1.0, "fiber_per_100g": 0.0, "serving_size_g": 85, "serving_label": "1/2 can"},

    # ── Dairy ─────────────────────────────────────────────────────────────────
    {"name": "Paneer (full fat)", "category": "dairy", "calories_per_100g": 265, "protein_per_100g": 18.3, "carbs_per_100g": 3.4, "fat_per_100g": 20.8, "fiber_per_100g": 0.0, "serving_size_g": 100, "serving_label": "100g"},
    {"name": "Paneer (low fat)", "category": "dairy", "calories_per_100g": 170, "protein_per_100g": 19.0, "carbs_per_100g": 4.5, "fat_per_100g": 8.0, "fiber_per_100g": 0.0, "serving_size_g": 100, "serving_label": "100g"},
    {"name": "Curd / Dahi (full fat)", "category": "dairy", "calories_per_100g": 98, "protein_per_100g": 3.5, "carbs_per_100g": 4.7, "fat_per_100g": 6.0, "fiber_per_100g": 0.0, "serving_size_g": 200, "serving_label": "1 cup"},
    {"name": "Curd / Dahi (low fat)", "category": "dairy", "calories_per_100g": 56, "protein_per_100g": 4.5, "carbs_per_100g": 4.7, "fat_per_100g": 0.9, "fiber_per_100g": 0.0, "serving_size_g": 200, "serving_label": "1 cup"},
    {"name": "Milk (full fat)", "category": "dairy", "calories_per_100g": 61, "protein_per_100g": 3.2, "carbs_per_100g": 4.8, "fat_per_100g": 3.3, "fiber_per_100g": 0.0, "serving_size_g": 250, "serving_label": "1 glass"},
    {"name": "Milk (toned)", "category": "dairy", "calories_per_100g": 44, "protein_per_100g": 3.3, "carbs_per_100g": 4.8, "fat_per_100g": 1.5, "fiber_per_100g": 0.0, "serving_size_g": 250, "serving_label": "1 glass"},
    {"name": "Greek Yogurt (plain)", "category": "dairy", "calories_per_100g": 59, "protein_per_100g": 10.0, "carbs_per_100g": 3.6, "fat_per_100g": 0.4, "fiber_per_100g": 0.0, "serving_size_g": 170, "serving_label": "1 cup"},
    {"name": "Whey Protein (powder)", "category": "dairy", "calories_per_100g": 370, "protein_per_100g": 75.0, "carbs_per_100g": 8.0, "fat_per_100g": 4.0, "fiber_per_100g": 0.0, "serving_size_g": 30, "serving_label": "1 scoop"},

    # ── Vegetables ────────────────────────────────────────────────────────────
    {"name": "Spinach (cooked)", "category": "vegetable", "calories_per_100g": 23, "protein_per_100g": 2.9, "carbs_per_100g": 3.6, "fat_per_100g": 0.4, "fiber_per_100g": 2.4, "serving_size_g": 100, "serving_label": "1 cup"},
    {"name": "Broccoli (cooked)", "category": "vegetable", "calories_per_100g": 35, "protein_per_100g": 2.4, "carbs_per_100g": 7.2, "fat_per_100g": 0.4, "fiber_per_100g": 3.3, "serving_size_g": 100, "serving_label": "1 cup"},
    {"name": "Potato (boiled)", "category": "vegetable", "calories_per_100g": 87, "protein_per_100g": 1.9, "carbs_per_100g": 20.0, "fat_per_100g": 0.1, "fiber_per_100g": 1.8, "serving_size_g": 150, "serving_label": "1 medium"},
    {"name": "Sweet Potato (boiled)", "category": "vegetable", "calories_per_100g": 76, "protein_per_100g": 1.4, "carbs_per_100g": 17.7, "fat_per_100g": 0.1, "fiber_per_100g": 2.5, "serving_size_g": 130, "serving_label": "1 medium"},
    {"name": "Bhindi / Okra (cooked)", "category": "vegetable", "calories_per_100g": 38, "protein_per_100g": 1.9, "carbs_per_100g": 7.5, "fat_per_100g": 0.2, "fiber_per_100g": 3.2, "serving_size_g": 100, "serving_label": "1 cup"},
    {"name": "Aloo Gobi (cooked)", "category": "vegetable", "calories_per_100g": 85, "protein_per_100g": 2.5, "carbs_per_100g": 12.0, "fat_per_100g": 3.0, "fiber_per_100g": 2.5, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Palak Paneer (cooked)", "category": "vegetable", "calories_per_100g": 140, "protein_per_100g": 7.0, "carbs_per_100g": 8.0, "fat_per_100g": 9.0, "fiber_per_100g": 1.8, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Tomato (raw)", "category": "vegetable", "calories_per_100g": 18, "protein_per_100g": 0.9, "carbs_per_100g": 3.9, "fat_per_100g": 0.2, "fiber_per_100g": 1.2, "serving_size_g": 120, "serving_label": "1 medium"},
    {"name": "Cucumber (raw)", "category": "vegetable", "calories_per_100g": 16, "protein_per_100g": 0.7, "carbs_per_100g": 3.6, "fat_per_100g": 0.1, "fiber_per_100g": 0.5, "serving_size_g": 120, "serving_label": "1 medium"},

    # ── Fruits ────────────────────────────────────────────────────────────────
    {"name": "Banana", "category": "fruit", "calories_per_100g": 89, "protein_per_100g": 1.1, "carbs_per_100g": 23.0, "fat_per_100g": 0.3, "fiber_per_100g": 2.6, "serving_size_g": 120, "serving_label": "1 medium"},
    {"name": "Apple", "category": "fruit", "calories_per_100g": 52, "protein_per_100g": 0.3, "carbs_per_100g": 14.0, "fat_per_100g": 0.2, "fiber_per_100g": 2.4, "serving_size_g": 150, "serving_label": "1 medium"},
    {"name": "Mango (Alphonso)", "category": "fruit", "calories_per_100g": 60, "protein_per_100g": 0.8, "carbs_per_100g": 15.0, "fat_per_100g": 0.4, "fiber_per_100g": 1.6, "serving_size_g": 200, "serving_label": "1 medium"},
    {"name": "Papaya", "category": "fruit", "calories_per_100g": 43, "protein_per_100g": 0.5, "carbs_per_100g": 11.0, "fat_per_100g": 0.3, "fiber_per_100g": 1.7, "serving_size_g": 200, "serving_label": "1 cup diced"},
    {"name": "Orange", "category": "fruit", "calories_per_100g": 47, "protein_per_100g": 0.9, "carbs_per_100g": 12.0, "fat_per_100g": 0.1, "fiber_per_100g": 2.4, "serving_size_g": 130, "serving_label": "1 medium"},

    # ── Fats & Nuts ───────────────────────────────────────────────────────────
    {"name": "Almonds", "category": "fat", "calories_per_100g": 579, "protein_per_100g": 21.2, "carbs_per_100g": 21.6, "fat_per_100g": 49.9, "fiber_per_100g": 12.5, "serving_size_g": 28, "serving_label": "1 oz (~23 almonds)"},
    {"name": "Walnuts", "category": "fat", "calories_per_100g": 654, "protein_per_100g": 15.2, "carbs_per_100g": 13.7, "fat_per_100g": 65.2, "fiber_per_100g": 6.7, "serving_size_g": 28, "serving_label": "1 oz (~14 halves)"},
    {"name": "Peanut Butter", "category": "fat", "calories_per_100g": 588, "protein_per_100g": 25.0, "carbs_per_100g": 20.0, "fat_per_100g": 50.0, "fiber_per_100g": 6.0, "serving_size_g": 32, "serving_label": "2 tbsp"},
    {"name": "Ghee", "category": "fat", "calories_per_100g": 900, "protein_per_100g": 0.0, "carbs_per_100g": 0.0, "fat_per_100g": 100.0, "fiber_per_100g": 0.0, "serving_size_g": 5, "serving_label": "1 tsp"},
    {"name": "Coconut Oil", "category": "fat", "calories_per_100g": 862, "protein_per_100g": 0.0, "carbs_per_100g": 0.0, "fat_per_100g": 100.0, "fiber_per_100g": 0.0, "serving_size_g": 14, "serving_label": "1 tbsp"},
    {"name": "Flaxseeds", "category": "fat", "calories_per_100g": 534, "protein_per_100g": 18.3, "carbs_per_100g": 28.9, "fat_per_100g": 42.2, "fiber_per_100g": 27.3, "serving_size_g": 15, "serving_label": "1 tbsp"},

    # ── Beverages / Snacks ────────────────────────────────────────────────────
    {"name": "Chai (milk tea, no sugar)", "category": "beverage", "calories_per_100g": 26, "protein_per_100g": 1.2, "carbs_per_100g": 3.0, "fat_per_100g": 1.0, "fiber_per_100g": 0.0, "serving_size_g": 150, "serving_label": "1 cup"},
    {"name": "Coconut Water", "category": "beverage", "calories_per_100g": 19, "protein_per_100g": 0.7, "carbs_per_100g": 3.7, "fat_per_100g": 0.2, "fiber_per_100g": 1.1, "serving_size_g": 240, "serving_label": "1 glass"},
    {"name": "Buttermilk (chaas, low fat)", "category": "beverage", "calories_per_100g": 40, "protein_per_100g": 3.3, "carbs_per_100g": 4.8, "fat_per_100g": 0.9, "fiber_per_100g": 0.0, "serving_size_g": 200, "serving_label": "1 glass"},
    {"name": "Masala Peanuts", "category": "snack", "calories_per_100g": 544, "protein_per_100g": 23.0, "carbs_per_100g": 30.0, "fat_per_100g": 38.0, "fiber_per_100g": 7.0, "serving_size_g": 30, "serving_label": "small handful"},
    {"name": "Murukku", "category": "snack", "calories_per_100g": 490, "protein_per_100g": 8.0, "carbs_per_100g": 65.0, "fat_per_100g": 22.0, "fiber_per_100g": 2.5, "serving_size_g": 50, "serving_label": "4-5 pieces"},
    {"name": "Samosa (fried)", "category": "snack", "calories_per_100g": 262, "protein_per_100g": 4.5, "carbs_per_100g": 32.0, "fat_per_100g": 13.0, "fiber_per_100g": 2.0, "serving_size_g": 100, "serving_label": "1 samosa"},
    {"name": "Protein Bar (generic)", "category": "snack", "calories_per_100g": 380, "protein_per_100g": 30.0, "carbs_per_100g": 35.0, "fat_per_100g": 10.0, "fiber_per_100g": 5.0, "serving_size_g": 60, "serving_label": "1 bar"},

    # ── Popular Indian Meals ──────────────────────────────────────────────────
    {"name": "Chicken Biryani", "category": "protein", "calories_per_100g": 195, "protein_per_100g": 11.0, "carbs_per_100g": 24.0, "fat_per_100g": 6.0, "fiber_per_100g": 1.2, "serving_size_g": 350, "serving_label": "1 plate"},
    {"name": "Paneer Butter Masala", "category": "protein", "calories_per_100g": 180, "protein_per_100g": 8.0, "carbs_per_100g": 10.0, "fat_per_100g": 13.0, "fiber_per_100g": 1.5, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Dal Makhani", "category": "protein", "calories_per_100g": 140, "protein_per_100g": 7.5, "carbs_per_100g": 16.0, "fat_per_100g": 5.5, "fiber_per_100g": 4.0, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Rajma Chawal", "category": "protein", "calories_per_100g": 145, "protein_per_100g": 6.5, "carbs_per_100g": 25.0, "fat_per_100g": 2.5, "fiber_per_100g": 4.5, "serving_size_g": 350, "serving_label": "1 plate"},
    {"name": "Pav Bhaji", "category": "grain", "calories_per_100g": 190, "protein_per_100g": 5.0, "carbs_per_100g": 28.0, "fat_per_100g": 7.0, "fiber_per_100g": 3.0, "serving_size_g": 300, "serving_label": "2 pav + bhaji"},
    {"name": "Chole Bhature", "category": "grain", "calories_per_100g": 250, "protein_per_100g": 7.0, "carbs_per_100g": 32.0, "fat_per_100g": 11.0, "fiber_per_100g": 4.0, "serving_size_g": 300, "serving_label": "1 bhatura + chole"},
    {"name": "Masala Dosa", "category": "grain", "calories_per_100g": 175, "protein_per_100g": 4.5, "carbs_per_100g": 26.0, "fat_per_100g": 6.0, "fiber_per_100g": 2.0, "serving_size_g": 200, "serving_label": "1 dosa"},
    {"name": "Vegetable Pulao", "category": "grain", "calories_per_100g": 150, "protein_per_100g": 3.5, "carbs_per_100g": 28.0, "fat_per_100g": 3.0, "fiber_per_100g": 2.0, "serving_size_g": 250, "serving_label": "1 plate"},
    {"name": "Aloo Paratha (with butter)", "category": "grain", "calories_per_100g": 280, "protein_per_100g": 6.5, "carbs_per_100g": 38.0, "fat_per_100g": 11.0, "fiber_per_100g": 3.0, "serving_size_g": 120, "serving_label": "1 paratha"},
    {"name": "Egg Bhurji", "category": "protein", "calories_per_100g": 180, "protein_per_100g": 12.0, "carbs_per_100g": 4.0, "fat_per_100g": 13.0, "fiber_per_100g": 0.5, "serving_size_g": 150, "serving_label": "2 eggs cooked"},
    {"name": "Chicken Curry", "category": "protein", "calories_per_100g": 165, "protein_per_100g": 15.0, "carbs_per_100g": 6.0, "fat_per_100g": 9.0, "fiber_per_100g": 1.0, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Fish Curry (Bengali style)", "category": "protein", "calories_per_100g": 130, "protein_per_100g": 14.0, "carbs_per_100g": 5.0, "fat_per_100g": 6.5, "fiber_per_100g": 0.8, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Tandoori Chicken", "category": "protein", "calories_per_100g": 150, "protein_per_100g": 23.0, "carbs_per_100g": 3.0, "fat_per_100g": 5.5, "fiber_per_100g": 0.5, "serving_size_g": 200, "serving_label": "2 pieces"},
    {"name": "Shahi Paneer", "category": "protein", "calories_per_100g": 220, "protein_per_100g": 9.0, "carbs_per_100g": 9.0, "fat_per_100g": 17.0, "fiber_per_100g": 1.0, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Mix Veg Sabzi", "category": "vegetable", "calories_per_100g": 80, "protein_per_100g": 2.5, "carbs_per_100g": 10.0, "fat_per_100g": 3.5, "fiber_per_100g": 3.0, "serving_size_g": 150, "serving_label": "1 bowl"},
    {"name": "Sambar", "category": "protein", "calories_per_100g": 45, "protein_per_100g": 2.8, "carbs_per_100g": 7.5, "fat_per_100g": 0.8, "fiber_per_100g": 2.5, "serving_size_g": 200, "serving_label": "1 bowl"},
    {"name": "Rasam", "category": "protein", "calories_per_100g": 25, "protein_per_100g": 1.0, "carbs_per_100g": 4.5, "fat_per_100g": 0.3, "fiber_per_100g": 0.5, "serving_size_g": 200, "serving_label": "1 bowl"},

    # ── Street Food & Fast Food ───────────────────────────────────────────────
    {"name": "Vada Pav", "category": "snack", "calories_per_100g": 230, "protein_per_100g": 5.0, "carbs_per_100g": 33.0, "fat_per_100g": 9.0, "fiber_per_100g": 2.0, "serving_size_g": 150, "serving_label": "1 piece"},
    {"name": "Pani Puri (6 pcs)", "category": "snack", "calories_per_100g": 150, "protein_per_100g": 3.5, "carbs_per_100g": 26.0, "fat_per_100g": 4.0, "fiber_per_100g": 2.0, "serving_size_g": 100, "serving_label": "6 puris"},
    {"name": "Bhel Puri", "category": "snack", "calories_per_100g": 165, "protein_per_100g": 4.0, "carbs_per_100g": 28.0, "fat_per_100g": 4.5, "fiber_per_100g": 2.5, "serving_size_g": 150, "serving_label": "1 serving"},
    {"name": "Burger (veg)", "category": "snack", "calories_per_100g": 245, "protein_per_100g": 6.5, "carbs_per_100g": 34.0, "fat_per_100g": 9.5, "fiber_per_100g": 2.5, "serving_size_g": 150, "serving_label": "1 burger"},
    {"name": "Burger (chicken)", "category": "protein", "calories_per_100g": 265, "protein_per_100g": 14.0, "carbs_per_100g": 28.0, "fat_per_100g": 11.0, "fiber_per_100g": 1.5, "serving_size_g": 170, "serving_label": "1 burger"},
    {"name": "Pizza (cheese, 1 slice)", "category": "snack", "calories_per_100g": 266, "protein_per_100g": 11.0, "carbs_per_100g": 33.0, "fat_per_100g": 10.0, "fiber_per_100g": 2.0, "serving_size_g": 100, "serving_label": "1 slice"},
    {"name": "French Fries", "category": "snack", "calories_per_100g": 312, "protein_per_100g": 3.4, "carbs_per_100g": 41.0, "fat_per_100g": 15.0, "fiber_per_100g": 3.5, "serving_size_g": 100, "serving_label": "medium portion"},
    {"name": "Dhokla", "category": "snack", "calories_per_100g": 160, "protein_per_100g": 5.0, "carbs_per_100g": 28.0, "fat_per_100g": 3.5, "fiber_per_100g": 1.5, "serving_size_g": 100, "serving_label": "2 pieces"},

    # ── Breakfast Items ───────────────────────────────────────────────────────
    {"name": "Bread (white, 1 slice)", "category": "grain", "calories_per_100g": 265, "protein_per_100g": 9.0, "carbs_per_100g": 49.0, "fat_per_100g": 3.2, "fiber_per_100g": 2.7, "serving_size_g": 30, "serving_label": "1 slice"},
    {"name": "Bread (whole wheat, 1 slice)", "category": "grain", "calories_per_100g": 247, "protein_per_100g": 13.0, "carbs_per_100g": 41.0, "fat_per_100g": 4.2, "fiber_per_100g": 7.0, "serving_size_g": 30, "serving_label": "1 slice"},
    {"name": "Boiled Egg", "category": "protein", "calories_per_100g": 155, "protein_per_100g": 13.0, "carbs_per_100g": 1.1, "fat_per_100g": 11.0, "fiber_per_100g": 0.0, "serving_size_g": 50, "serving_label": "1 egg"},
    {"name": "Omelette (2 eggs)", "category": "protein", "calories_per_100g": 185, "protein_per_100g": 13.5, "carbs_per_100g": 1.5, "fat_per_100g": 14.5, "fiber_per_100g": 0.0, "serving_size_g": 100, "serving_label": "2 eggs"},
    {"name": "Cornflakes with milk", "category": "grain", "calories_per_100g": 100, "protein_per_100g": 3.5, "carbs_per_100g": 19.0, "fat_per_100g": 1.5, "fiber_per_100g": 0.5, "serving_size_g": 250, "serving_label": "1 bowl"},
    {"name": "Banana Shake", "category": "beverage", "calories_per_100g": 90, "protein_per_100g": 3.0, "carbs_per_100g": 16.0, "fat_per_100g": 2.0, "fiber_per_100g": 0.5, "serving_size_g": 300, "serving_label": "1 glass"},
    {"name": "Mango Lassi", "category": "beverage", "calories_per_100g": 85, "protein_per_100g": 3.0, "carbs_per_100g": 14.0, "fat_per_100g": 2.0, "fiber_per_100g": 0.3, "serving_size_g": 300, "serving_label": "1 glass"},
    {"name": "Protein Shake (whey + milk)", "category": "beverage", "calories_per_100g": 70, "protein_per_100g": 8.0, "carbs_per_100g": 7.0, "fat_per_100g": 1.5, "fiber_per_100g": 0.0, "serving_size_g": 300, "serving_label": "1 shake"},

    # ── Sweets & Desserts ─────────────────────────────────────────────────────
    {"name": "Gulab Jamun", "category": "snack", "calories_per_100g": 385, "protein_per_100g": 5.5, "carbs_per_100g": 56.0, "fat_per_100g": 15.0, "fiber_per_100g": 0.5, "serving_size_g": 60, "serving_label": "1 piece"},
    {"name": "Rasgulla", "category": "snack", "calories_per_100g": 186, "protein_per_100g": 4.5, "carbs_per_100g": 38.0, "fat_per_100g": 1.5, "fiber_per_100g": 0.0, "serving_size_g": 60, "serving_label": "1 piece"},
    {"name": "Kheer (rice pudding)", "category": "snack", "calories_per_100g": 156, "protein_per_100g": 4.0, "carbs_per_100g": 26.0, "fat_per_100g": 4.5, "fiber_per_100g": 0.2, "serving_size_g": 150, "serving_label": "1 bowl"},
    {"name": "Halwa (sooji)", "category": "snack", "calories_per_100g": 310, "protein_per_100g": 4.5, "carbs_per_100g": 44.0, "fat_per_100g": 13.0, "fiber_per_100g": 1.0, "serving_size_g": 100, "serving_label": "1 serving"},
    {"name": "Dark Chocolate (70%)", "category": "snack", "calories_per_100g": 598, "protein_per_100g": 7.8, "carbs_per_100g": 45.0, "fat_per_100g": 42.0, "fiber_per_100g": 10.9, "serving_size_g": 30, "serving_label": "3 squares"},
]
