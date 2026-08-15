import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateFoodSafety } from './safety-rules.ts';

test('evaluateFoodSafety flags choking risk for whole grapes in young infants', () => {
  const result = evaluateFoodSafety({
    babyAgeDays: 180,
    foodName: 'grapes',
    texture: 'whole',
    preparation: 'raw',
    allergenStatus: 'unknown',
    introductionHistory: [],
  });

  assert.equal(result.chokingConsideration.length > 0, true);
  assert.equal(result.appropriateToExplore, false);
});

test('evaluateFoodSafety allows age-appropriate soft foods with signals', () => {
  const result = evaluateFoodSafety({
    babyAgeDays: 270,
    foodName: 'banana',
    texture: 'mashed',
    preparation: 'steamed',
    allergenStatus: 'not-reported',
    introductionHistory: ['banana'],
  });

  assert.equal(result.appropriateToExplore, true);
  assert.equal(result.preparationAdjustment.length >= 1, true);
});
