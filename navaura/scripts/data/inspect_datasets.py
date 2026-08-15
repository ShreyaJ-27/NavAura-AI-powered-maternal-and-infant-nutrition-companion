#!/usr/bin/env python3
"""Inspect available datasets and summarize them for the ingestion pipeline."""

from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATASETS = ROOT.parent / 'Datasets'


def main() -> None:
    records = []
    for item in sorted(DATASETS.iterdir()):
        records.append({
            'name': item.name,
            'kind': 'directory' if item.is_dir() else 'file',
            'size_bytes': item.stat().st_size if item.is_file() else None,
            'suffix': item.suffix.lower(),
        })

    output = {
        'dataset_root': str(DATASETS),
        'files': records,
        'summary': {
            'total_items': len(records),
            'files': sum(1 for item in records if item['kind'] == 'file'),
            'directories': sum(1 for item in records if item['kind'] == 'directory'),
        }
    }

    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
