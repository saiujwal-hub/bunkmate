import type { Subject } from "./types";

/** How many bunks one credit buys. */
export const BUNKS_PER_CREDIT = 3;

/** The one formula this app runs on: credits × 3. */
export function maxBunks(s: Pick<Subject, "credits">): number {
  return s.credits * BUNKS_PER_CREDIT;
}

export function bunksRemaining(s: Subject): number {
  return maxBunks(s) - s.bunksUsed;
}

export function clampBunks(value: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), 0), max);
}

export interface Totals {
  subjects: number;
  max: number;
  used: number;
  remaining: number;
}

export function totalsOf(subjects: Subject[]): Totals {
  let max = 0;
  let used = 0;
  for (const s of subjects) {
    max += maxBunks(s);
    used += s.bunksUsed;
  }
  return { subjects: subjects.length, max, used, remaining: max - used };
}

export function isPositiveWhole(n: number): boolean {
  return Number.isInteger(n) && n >= 1;
}

export function isNonNegativeWhole(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

export function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Duplicate check is forgiving about case and stray spaces, so "ds" and "DS " collide. */
export function findDuplicateName(names: Array<{ name: string; ignoreKey?: string }>): string | null {
  const seen = new Map<string, string>();
  for (const { name, ignoreKey } of names) {
    const clean = name.trim().toLowerCase();
    if (!clean || ignoreKey) continue;
    if (seen.has(clean)) return name.trim();
    seen.set(clean, clean);
  }
  return null;
}
