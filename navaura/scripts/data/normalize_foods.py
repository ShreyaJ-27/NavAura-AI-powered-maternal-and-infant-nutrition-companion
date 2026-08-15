#!/usr/bin/env python3
"""Normalize food records from USDA Foundation & SR Legacy JSON into verified nutrition dataset."""

from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATASETS = ROOT.parent / 'Datasets'
OUTPUT_DIR = ROOT / 'data'
OUTPUT_FILE = OUTPUT_DIR / 'normalized_foods.json'


def extract_nutrients(food_nutrients: list) -> dict:
    """Extract key nutrients: Energy, Protein, Fat, Carbs, Fiber, Iron, Calcium, Vitamin C."""
    nutrients = {
        'calories': 0.0,
        'protein_g': 0.0,
        'fat_g': 0.0,
        'carbs_g': 0.0,
        'fiber_g': 0.0,
        'iron_mg': 0.0,
        'calcium_mg': 0.0,
        'vitamin_c_mg': 0.0,
    }

    if not isinstance(food_nutrients, list):
        return nutrients

    for item in food_nutrients:
        if not isinstance(item, dict):
            continue
        nutrient_info = item.get('nutrient') or {}
        if not isinstance(nutrient_info, dict):
            nutrient_info = {}

        name = str(nutrient_info.get('name') or item.get('name') or '').lower()
        amount = 0.0
        try:
            val = item.get('amount') if item.get('amount') is not None else item.get('value')
            if val is not None:
                amount = float(val)
        except (ValueError, TypeError):
            amount = 0.0

        unit = str(nutrient_info.get('unitName') or '').lower()

        if 'energy' in name and ('kcal' in unit or 'kcal' in name or amount < 1000):
            if nutrients['calories'] == 0.0:
                nutrients['calories'] = round(amount, 1)
        elif 'protein' in name and nutrients['protein_g'] == 0.0:
            nutrients['protein_g'] = round(amount, 1)
        elif ('total lipid' in name or name == 'fat') and nutrients['fat_g'] == 0.0:
            nutrients['fat_g'] = round(amount, 1)
        elif 'carbohydrate' in name and nutrients['carbs_g'] == 0.0:
            nutrients['carbs_g'] = round(amount, 1)
        elif 'fiber' in name and nutrients['fiber_g'] == 0.0:
            nutrients['fiber_g'] = round(amount, 1)
        elif 'iron' in name and nutrients['iron_mg'] == 0.0:
            nutrients['iron_mg'] = round(amount, 2)
        elif 'calcium' in name and nutrients['calcium_mg'] == 0.0:
            nutrients['calcium_mg'] = round(amount, 1)
        elif ('vitamin c' in name or 'ascorbic' in name) and nutrients['vitamin_c_mg'] == 0.0:
            nutrients['vitamin_c_mg'] = round(amount, 1)

    return nutrients


def categorize_food(name: str) -> str:
    name_lower = name.lower()
    if any(w in name_lower for w in ['apple', 'banana', 'orange', 'berry', 'grape', 'mango', 'peach', 'pear', 'avocado', 'fruit']):
        return 'Fruits'
    if any(w in name_lower for w in ['carrot', 'spinach', 'broccoli', 'kale', 'potato', 'squash', 'pumpkin', 'sweet potato', 'pea', 'vegetable']):
        return 'Vegetables'
    if any(w in name_lower for w in ['rice', 'oat', 'wheat', 'bread', 'quinoa', 'barley', 'cereal', 'idli', 'dosa', 'roti', 'grain']):
        return 'Grains'
    if any(w in name_lower for w in ['milk', 'yogurt', 'cheese', 'paneer', 'curd', 'formula', 'dairy']):
        return 'Dairy & Alternatives'
    if any(w in name_lower for w in ['egg', 'chicken', 'fish', 'meat', 'tofu', 'dal', 'lentil', 'chickpea', 'beans', 'beef', 'pork']):
        return 'Protein Foods'
    return 'General'


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    foundation_file = DATASETS / 'FoodData_Central_foundation_food_json_2026-04-30.json'

    normalized_foods = []

    if foundation_file.exists():
        try:
            with foundation_file.open('r', encoding='utf-8') as f:
                data = json.load(f)
                foundation_list = data.get('FoundationFoods', [])
                if isinstance(foundation_list, list):
                    for item in foundation_list:
                        if not isinstance(item, dict):
                            continue
                        description = item.get('description', '')
                        if not description:
                            continue
                        nutrients = extract_nutrients(item.get('foodNutrients', []))
                        normalized_foods.append({
                            'id': f"fdc-{item.get('fdcId')}",
                            'name': description,
                            'category': categorize_food(description),
                            'source': 'USDA Foundation Foods',
                            'nutrients': nutrients,
                        })
        except Exception as e:
            print(f"Error processing foundation foods: {e}")

    curated_foods = [
        {
            'id': 'navaura-1',
            'name': 'Oatmeal Porridge',
            'category': 'Grains',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 150.0, 'protein_g': 5.0, 'fat_g': 2.5, 'carbs_g': 27.0, 'fiber_g': 4.0, 'iron_mg': 2.1, 'calcium_mg': 80.0, 'vitamin_c_mg': 0.0}
        },
        {
            'id': 'navaura-2',
            'name': 'Steamed Banana Puree',
            'category': 'Fruits',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 89.0, 'protein_g': 1.1, 'fat_g': 0.3, 'carbs_g': 22.8, 'fiber_g': 2.6, 'iron_mg': 0.3, 'calcium_mg': 5.0, 'vitamin_c_mg': 8.7}
        },
        {
            'id': 'navaura-3',
            'name': 'Mashed Sweet Potato',
            'category': 'Vegetables',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 86.0, 'protein_g': 1.6, 'fat_g': 0.1, 'carbs_g': 20.1, 'fiber_g': 3.0, 'iron_mg': 0.6, 'calcium_mg': 30.0, 'vitamin_c_mg': 12.8}
        },
        {
            'id': 'navaura-4',
            'name': 'Avocado Mash',
            'category': 'Fruits',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 160.0, 'protein_g': 2.0, 'fat_g': 14.7, 'carbs_g': 8.5, 'fiber_g': 6.7, 'iron_mg': 0.6, 'calcium_mg': 12.0, 'vitamin_c_mg': 10.0}
        },
        {
            'id': 'navaura-5',
            'name': 'Steamed Carrot Sticks',
            'category': 'Vegetables',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 35.0, 'protein_g': 0.8, 'fat_g': 0.2, 'carbs_g': 8.2, 'fiber_g': 2.5, 'iron_mg': 0.3, 'calcium_mg': 33.0, 'vitamin_c_mg': 3.6}
        },
        {
            'id': 'navaura-6',
            'name': 'Soft Scrambled Egg',
            'category': 'Protein Foods',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 148.0, 'protein_g': 12.6, 'fat_g': 10.0, 'carbs_g': 0.8, 'fiber_g': 0.0, 'iron_mg': 1.8, 'calcium_mg': 56.0, 'vitamin_c_mg': 0.0}
        },
        {
            'id': 'navaura-7',
            'name': 'Red Lentil Dal Puree',
            'category': 'Protein Foods',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 116.0, 'protein_g': 9.0, 'fat_g': 0.4, 'carbs_g': 20.0, 'fiber_g': 3.9, 'iron_mg': 3.3, 'calcium_mg': 19.0, 'vitamin_c_mg': 1.5}
        },
        {
            'id': 'navaura-8',
            'name': 'Greek Yogurt',
            'category': 'Dairy & Alternatives',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 97.0, 'protein_g': 9.0, 'fat_g': 5.0, 'carbs_g': 3.9, 'fiber_g': 0.0, 'iron_mg': 0.1, 'calcium_mg': 100.0, 'vitamin_c_mg': 0.0}
        },
        {
            'id': 'navaura-9',
            'name': 'Idli (Steamed Rice & Lentil Cake)',
            'category': 'Grains',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 130.0, 'protein_g': 4.5, 'fat_g': 0.5, 'carbs_g': 27.0, 'fiber_g': 1.8, 'iron_mg': 1.2, 'calcium_mg': 18.0, 'vitamin_c_mg': 0.0}
        },
        {
            'id': 'navaura-10',
            'name': 'Spinach & Apple Puree',
            'category': 'Vegetables',
            'source': 'USDA / NavAura Verified',
            'nutrients': {'calories': 52.0, 'protein_g': 1.2, 'fat_g': 0.3, 'carbs_g': 12.5, 'fiber_g': 2.8, 'iron_mg': 1.5, 'calcium_mg': 45.0, 'vitamin_c_mg': 14.0}
        }
    ]

    all_foods = curated_foods + normalized_foods

    with OUTPUT_FILE.open('w', encoding='utf-8') as f:
        json.dump({
            'total_count': len(all_foods),
            'curated_count': len(curated_foods),
            'foods': all_foods,
        }, f, indent=2)

    print(f"Normalized {len(all_foods)} food items saved to {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
