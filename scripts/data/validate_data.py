#!/usr/bin/env python3
"""Validate normalized food dataset against required health data schema."""

from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = ROOT / 'data' / 'normalized_foods.json'


def main() -> None:
    if not INPUT_FILE.exists():
        print(f"Error: Normalized dataset file not found at {INPUT_FILE}", file=sys.stderr)
        sys.exit(1)

    with INPUT_FILE.open('r', encoding='utf-8') as f:
        data = json.load(f)

    foods = data.get('foods', [])
    if not foods:
        print("Error: Dataset contains 0 foods.", file=sys.stderr)
        sys.exit(1)

    required_keys = {'id', 'name', 'category', 'nutrients'}
    required_nutrients = {'calories', 'protein_g', 'fat_g', 'carbs_g', 'fiber_g', 'iron_mg', 'calcium_mg'}

    errors = []
    for idx, item in enumerate(foods):
        missing = required_keys - set(item.keys())
        if missing:
            errors.append(f"Item #{idx} ({item.get('name', 'unnamed')}) missing keys: {missing}")
            continue

        nutrients = item.get('nutrients', {})
        missing_nutrients = required_nutrients - set(nutrients.keys())
        if missing_nutrients:
            errors.append(f"Item #{idx} ({item.get('name')}) missing nutrients: {missing_nutrients}")

    if errors:
        print(f"Validation failed with {len(errors)} errors:")
        for err in errors[:10]:
            print(f" - {err}")
        sys.exit(1)

    print(f"Validation SUCCESS: {len(foods)} food records verified successfully.")


if __name__ == '__main__':
    main()
