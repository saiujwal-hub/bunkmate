import type { Subject } from "./types";
import { isNonNegativeWhole, isPositiveWhole } from "./calc";

const KEY = "bunkmate:v1";

interface StoredShape {
  setupDone: boolean;
  subjects: Subject[];
}

export function loadState(): StoredShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { setupDone: false, subjects: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { setupDone: false, subjects: [] };
    const { setupDone, subjects } = parsed as Record<string, unknown>;
    if (!Array.isArray(subjects)) return { setupDone: false, subjects: [] };

    const clean: Subject[] = [];
    for (const item of subjects) {
      if (!item || typeof item !== "object") continue;
      const s = item as Record<string, unknown>;
      const name = typeof s.name === "string" ? s.name : "";
      const credits = Number(s.credits);
      const used = Number(s.bunksUsed);
      if (!name || !isPositiveWhole(credits)) continue;
      /* Old boards stored a per-week figure too — drop it, keep name, credits and tallies. */
      const max = credits * 3;
      clean.push({
        id: typeof s.id === "string" ? s.id : crypto.randomUUID(),
        name,
        credits,
        bunksUsed: isNonNegativeWhole(used) ? Math.min(used, max) : 0,
      });
    }
    return { setupDone: setupDone === true && clean.length > 0, subjects: clean };
  } catch {
    return { setupDone: false, subjects: [] };
  }
}

export function saveState(state: StoredShape): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the board just resets next visit */
  }
}
