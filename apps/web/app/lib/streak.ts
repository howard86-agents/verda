import type { BehaviorLog } from "./db";

/**
 * Streak helper for issue #92.
 *
 * The consecutive-day streak is computed from a member's behavior log:
 * a day counts toward the streak if the member checked in or completed
 * a read on that day. We work in UTC so dates are deterministic across
 * timezones and the same in tests as in the browser.
 */

const STREAK_ACTIONS = new Set(["check_in", "read_complete"]);

/**
 * Reduce a list of ISO timestamps to the unique set of UTC YYYY-MM-DD
 * day-keys. Works on any timestamp format the rest of the app produces.
 */
function uniqueDayKeys(logs: BehaviorLog[]): Set<string> {
  const out = new Set<string>();
  for (const l of logs) {
    if (!STREAK_ACTIONS.has(l.action)) {
      continue;
    }
    if (typeof l.createdAt !== "string") {
      continue;
    }
    out.add(l.createdAt.slice(0, 10));
  }
  return out;
}

/**
 * Move a YYYY-MM-DD day-key back by one day (UTC). Returns the new
 * key. Caller is responsible for passing a well-formed key.
 */
function previousDay(dayKey: string): string {
  const t = Date.UTC(
    Number.parseInt(dayKey.slice(0, 4), 10),
    Number.parseInt(dayKey.slice(5, 7), 10) - 1,
    Number.parseInt(dayKey.slice(8, 10), 10)
  );
  return new Date(t - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Compute the current streak length in consecutive days, anchored to
 * `today` (defaults to the system's UTC day).
 *
 * The streak counts back from today. If today has activity, today
 * counts; if today has no activity but yesterday does, the streak
 * runs from yesterday backwards (so a member checking in only once
 * a day shows a streak of 1+ on the day they check in, regardless
 * of when they open the page next).
 *
 * Returns `0` for members with no qualifying activity.
 */
export function computeStreak(
  logs: BehaviorLog[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  const days = uniqueDayKeys(logs);
  if (days.size === 0) {
    return 0;
  }
  // Anchor: prefer today, fall back to yesterday so the streak doesn't
  // collapse the moment the day rolls over before today's activity lands.
  let cursor = today;
  if (!days.has(cursor)) {
    const yesterday = previousDay(cursor);
    if (!days.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

/**
 * Decide whether the streak just extended into a "maintaining" day —
 * i.e. day 2 or later. The reward rule fires on this transition so the
 * very first qualifying day doesn't double-up with the read/check-in
 * award.
 */
export function isMaintainingStreak(streak: number): boolean {
  return streak >= 2;
}
