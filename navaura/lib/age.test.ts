import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateBabyAge, calculatePostpartumAge } from './age.ts';

test('calculateBabyAge handles day, week, month, and leap-year cases', () => {
  const birth = new Date('2025-02-28T12:00:00Z');
  const now = new Date('2025-03-14T12:00:00Z');
  const age = calculateBabyAge(birth, now);

  assert.equal(age.days, 14);
  assert.equal(age.weeks, 2);
  assert.equal(age.months, 0);
  assert.equal(age.years, 0);
});

test('calculatePostpartumAge returns postpartum context without diagnosis', () => {
  const delivery = new Date('2025-03-01T12:00:00Z');
  const now = new Date('2025-03-15T12:00:00Z');
  const age = calculatePostpartumAge(delivery, now);

  assert.equal(age.day, 14);
  assert.equal(age.week, 2);
  assert.equal(age.month, 0);
  assert.equal(age.stage, 'Early postpartum');
});
