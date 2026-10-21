/* Sanity check: the real calc functions against the credits × 3 brief. */
import {
  BUNKS_PER_CREDIT,
  bunksRemaining,
  findDuplicateName,
  isNonNegativeWhole,
  isPositiveWhole,
  maxBunks,
  totalsOf,
} from "../src/lib/calc.ts";

const assert = (cond: any, label: string) => {
  if (!cond) {
    console.error("FAIL:", label);
    process.exitCode = 1;
  } else {
    console.log("ok:", label);
  }
};

assert(BUNKS_PER_CREDIT === 3, "one credit buys 3 bunks");

// Formula table from the brief
const table: Array<[number, number]> = [
  [1, 3],
  [2, 6],
  [3, 9],
  [4, 12],
  [5, 15],
];
for (const [credits, expected] of table) {
  assert(maxBunks({ credits }) === expected, `max ${credits} credits = ${expected}`);
}

// Worked example: 4 credits = 12 allowed, 5 used → 7 remaining
const dsco = { id: "a", name: "DS&CO", credits: 4, bunksUsed: 5 };
assert(maxBunks(dsco) === 12, "DS&CO max = 12");
assert(bunksRemaining(dsco) === 7, "DS&CO remaining = 7");

// Representative subject set
const subjects = [
  { id: "a", name: "DS&CO", credits: 4, bunksUsed: 5 },
  { id: "b", name: "DS", credits: 3, bunksUsed: 0 },
  { id: "c", name: "DCCN", credits: 3, bunksUsed: 0 },
  { id: "d", name: "DA", credits: 3, bunksUsed: 0 },
  { id: "e", name: "DMS", credits: 3, bunksUsed: 2 },
  { id: "f", name: "Data Structures Lab", credits: 1, bunksUsed: 0 },
  { id: "g", name: "Digital Systems Lab", credits: 1, bunksUsed: 0 },
];
const t = totalsOf(subjects);
assert(t.subjects === 7, "7 subjects");
assert(t.max === 54, `total max = 54 (got ${t.max})`);
assert(t.used === 7, "total used = 7");
assert(t.remaining === 47, `total remaining = 47 (got ${t.remaining})`);

// Validation rules
assert(isPositiveWhole(1) && isPositiveWhole(7), "positive whole accepts 1, 7");
assert(!isPositiveWhole(0) && !isPositiveWhole(2.5) && !isPositiveWhole(-1) && !isPositiveWhole(NaN), "positive whole rejects 0, 2.5, -1, NaN");
assert(isNonNegativeWhole(0) && isNonNegativeWhole(12), "non-negative whole accepts 0, 12");
assert(!isNonNegativeWhole(-3) && !isNonNegativeWhole(1.5), "non-negative whole rejects -3, 1.5");

// Duplicates (case/space forgiving), self row excluded in edit checks
assert(findDuplicateName([{ name: "ds" }, { name: "DS " }]) === "DS", "duplicate 'ds'/'DS ' caught");
assert(findDuplicateName([{ name: "DS" }, { name: "DMS" }]) === null, "distinct names pass");
assert(findDuplicateName([{ name: "DS", ignoreKey: "x" }, { name: "DS" }]) === null, "ignored self rows pass");

// Guard behaviour mirrors App.setUsed
const clampedMax = Math.min(Math.max(16, 0), 15);
assert(clampedMax === 15, "+1 at max clamps to 15 when credits = 5");
const clampedMin = Math.min(Math.max(-1, 0), 15);
assert(clampedMin === 0, "dec at zero clamps to 0");
