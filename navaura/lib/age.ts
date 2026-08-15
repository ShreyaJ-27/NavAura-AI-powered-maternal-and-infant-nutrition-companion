export type BabyAge = {
  days: number;
  weeks: number;
  months: number;
  years: number;
  formatted: string;
};

export type PostpartumAge = {
  day: number;
  week: number;
  month: number;
  stage: string;
};

export function calculateBabyAge(
  birthDate: Date,
  now: Date = new Date(),
): BabyAge {
  const start = new Date(birthDate);
  const current = new Date(now);

  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) {
    throw new Error('Invalid date input');
  }

  if (current < start) {
    return {
      days: 0,
      weeks: 0,
      months: 0,
      years: 0,
      formatted: '0 days',
    };
  }

  let years = current.getUTCFullYear() - start.getUTCFullYear();
  let months = current.getUTCMonth() - start.getUTCMonth();
  let days = current.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 0));
    days += previousMonth.getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.max(
    0,
    Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const weeks = Math.floor(totalDays / 7);

  return {
    days: totalDays,
    weeks,
    months: years * 12 + months,
    years,
    formatted: years > 0 ? `${years}y ${months}m` : months > 0 ? `${months}m` : `${totalDays}d`,
  };
}

export function calculatePostpartumAge(
  deliveryDate: Date,
  now: Date = new Date(),
): PostpartumAge {
  const totalDays = Math.max(
    0,
    Math.floor((new Date(now).getTime() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24)),
  );

  const day = totalDays;
  const week = Math.floor(totalDays / 7);
  const month = Math.floor(totalDays / 30);

  let stage = 'Early postpartum';
  if (totalDays >= 42) stage = 'Late postpartum';
  if (totalDays >= 360) stage = 'Established postpartum';

  return { day, week, month, stage };
}
