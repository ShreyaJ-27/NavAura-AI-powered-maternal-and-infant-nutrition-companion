import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureChildIds, migrateLegacyProfile, getSelectedChild, calculateChildStage } from './children.ts';

test('ensureChildIds generates UUIDs for children missing IDs', () => {
  const result = ensureChildIds([
    { name: 'Ava', birthDate: '2025-12-01', weightKg: 7.5 },
    { name: 'Mira', birthDate: '2026-06-01', weightKg: 5.2 },
  ]);

  assert.equal(result.length, 2);
  assert.ok(result[0].id.length > 0);
  assert.ok(result[1].id.length > 0);
  assert.notEqual(result[0].id, result[1].id);
  assert.equal(result[0].name, 'Ava');
  assert.equal(result[1].name, 'Mira');
});

test('migrateLegacyProfile converts legacy single baby into children array', () => {
  const legacy = {
    motherName: 'Elena',
    babyName: 'Maya',
    birthDate: '2025-11-20',
    weightKg: 7.2,
  };

  const migrated = migrateLegacyProfile(legacy);
  assert.equal(migrated.children.length, 1);
  assert.equal(migrated.children[0].name, 'Maya');
  assert.ok(migrated.children[0].id.length > 0);
  assert.equal(migrated.selectedChildId, migrated.children[0].id);
});

test('getSelectedChild returns correct child by id', () => {
  const children = [
    { id: 'child-1', name: 'Ava', birthDate: '2025-12-01' },
    { id: 'child-2', name: 'Mira', birthDate: '2026-06-01' },
  ];

  const selected = getSelectedChild(children, 'child-2');
  assert.equal(selected?.name, 'Mira');

  const fallback = getSelectedChild(children, 'non-existent');
  assert.equal(fallback?.name, 'Ava');
});

test('calculateChildStage returns appropriate developmental stage', () => {
  assert.equal(calculateChildStage(2).includes('Exclusive milk'), true);
  assert.equal(calculateChildStage(7).includes('6–8m purees'), true);
  assert.equal(calculateChildStage(10).includes('9–11m dices'), true);
  assert.equal(calculateChildStage(15).includes('Toddler table'), true);
});
