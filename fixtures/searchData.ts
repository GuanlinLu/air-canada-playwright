/**
 * Helper to keep portfolio demo dates valid without constantly editing tests.
 *
 * We still express the "ideal" demo dates (Feb 14 and Mar 14) in one place,
 * but if those fall in the past, we automatically roll them forward by years
 * until they are in the future. Month and day stay the same.
 */
function rollForwardIfPast(
  year: number,
  month: number,
  day: number
): { day: number; month: number; year: number } {
  const target = new Date(year, month - 1, day);
  const today = new Date();

  while (target < today) {
    target.setFullYear(target.getFullYear() + 1);
  }

  return {
    day: target.getDate(),
    month: target.getMonth() + 1,
    year: target.getFullYear(),
  };
}

export const searchData = {
  origin: 'Toronto',
  destination: 'Guangzhou',
  /**
   * Logical demo dates (Feb 14 and Mar 14) defined once here;
   * `rollForwardIfPast` keeps them in the future so tests don't expire.
   */
  departureDate: rollForwardIfPast(2026, 2, 14),
  returnDate: rollForwardIfPast(2026, 3, 14),
};
