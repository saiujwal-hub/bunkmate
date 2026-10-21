import { useRef, useState } from "react";
import type { Subject } from "../lib/types";
import { isPositiveWhole, totalsOf } from "../lib/calc";
import GaugeDial from "./GaugeDial";
import SubjectRow, { type NotifyFn } from "./SubjectRow";
import { chalkBtn, chalkBtnDangerArmed } from "./ui";

interface Props {
  subjects: Subject[];
  onSetUsed: (id: string, bunksUsed: number) => void;
  onEdit: (id: string, patch: { name: string; credits: number }) => void;
  onDelete: (id: string) => void;
  onResetCounters: () => void;
  onNewBoard: () => void;
}

type Flash = { tone: "warn" | "calm"; text: string } | null;

function statusLine(remaining: number, max: number): string {
  if (max <= 0) return "";
  if (remaining === 0) return "Every bunk is spent. Attend everything from here on.";
  const share = remaining / max;
  const mood =
    share > 0.6 ? "Plenty of room." : share > 0.3 ? "Halfway spent." : "Running low.";
  return `${remaining} bunks still allowed. ${mood}`;
}

export default function CalculatorScreen({
  subjects,
  onSetUsed,
  onEdit,
  onDelete,
  onResetCounters,
  onNewBoard,
}: Props) {
  const totals = totalsOf(subjects);
  /* Same maths as the needle: what remains of the allowance, said as attendance. */
  const attendance = totals.max > 0 ? ((totals.max - totals.used) / totals.max) * 100 : 100;
  const attnLabel = `${Number((Math.round(attendance * 10) / 10).toFixed(1))}%`;
  const [flash, setFlash] = useState<Flash>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [newArmed, setNewArmed] = useState(false);
  const resetArmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushFlash: NotifyFn = (tone, text) => {
    setFlash({ tone, text });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4200);
  };

  const percentLeft = totals.max > 0 ? Math.round((totals.remaining / totals.max) * 100) : 0;

  const tapReset = () => {
    if (resetArmed) {
      setResetArmed(false);
      onResetCounters();
      pushFlash("calm", "Board wiped. Every tally starts back at zero.");
    } else {
      setResetArmed(true);
      if (resetArmTimer.current) clearTimeout(resetArmTimer.current);
      resetArmTimer.current = setTimeout(() => setResetArmed(false), 2600);
    }
  };

  const tapNew = () => {
    if (newArmed) {
      setNewArmed(false);
      onNewBoard();
    } else {
      setNewArmed(true);
      if (resetArmTimer.current) clearTimeout(resetArmTimer.current);
      resetArmTimer.current = setTimeout(() => setNewArmed(false), 2600);
    }
  };

  const stats: Array<{ big: string; small: string }> = [
    { big: String(totals.subjects), small: "subjects" },
    { big: String(totals.max), small: "bunks allowed" },
    { big: String(totals.used), small: "bunks used" },
    { big: String(totals.remaining), small: "bunks remaining" },
  ];

  return (
    <div className="chalk-board relative w-full max-w-[1120px] font-hand text-chalk">
      <header
        className="mb-2 flex max-sm:flex-col-reverse max-sm:items-center sm:items-start justify-between gap-6"
      >
        <div>
          <h1 className="m-0 font-display text-[1.7rem] tracking-[0.02em] text-chalk">BunkMate</h1>
          <p className="mt-2 max-w-[48ch] font-hand text-[1rem] leading-[1.5] text-chalk/55">
            Five strokes and a slash, like after the last class. Tap +1 to mark a bunk, −1 to
            take one back, or write the count straight in.
          </p>
          <p
            aria-live="polite"
            className={`mt-2 min-h-[1.4rem] font-hand text-[1rem] ${flash?.tone === "warn" ? "text-chalkpink" : "text-chalk/55"}`}
          >
            {flash?.text ?? statusLine(totals.remaining, totals.max)}
          </p>
        </div>
        <GaugeDial
          percent={percentLeft}
          big={attnLabel}
          small="semester attendance"
        />
      </header>

      {/* The week's sums, written across one chalk line. */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b-2 border-dotted border-chalk/15 pb-4">
        {stats.map((s) => (
          <span key={s.small} className="flex items-baseline gap-2">
            <span className="font-display text-[1.2rem] text-chalk">{s.big}</span>
            <span className="font-hand text-[0.85rem] text-chalk/55">{s.small}</span>
          </span>
        ))}
      </div>

      <ol className="m-0 mt-1 list-none p-0">
        {subjects.map((subject) => (
          <SubjectRow
            key={subject.id}
            subject={subject}
            allNames={subjects.map((s) => ({ name: s.name, ignoreKey: s.id }))}
            onSetUsed={onSetUsed}
            onEdit={onEdit}
            onDelete={onDelete}
            notify={pushFlash}
          />
        ))}
      </ol>

      <footer className="mt-6 flex flex-wrap items-baseline justify-between gap-4 font-hand text-[0.92rem] text-chalk/55">
        <p className="m-0 max-w-[62ch]">
          One stroke = one bunked class. A subject's whole allowance is its credits × 3. Counts
          save on this device.
        </p>
        <div className="flex flex-wrap items-baseline gap-2">
          <button
            type="button"
            className={`${chalkBtn} ${resetArmed ? chalkBtnDangerArmed : ""}`}
            onClick={tapReset}
          >
            {resetArmed ? "sure? tap again" : "Wipe all tallies"}
          </button>
          <button
            type="button"
            className={`${chalkBtn} ${newArmed ? chalkBtnDangerArmed : ""}`}
            onClick={tapNew}
            aria-label="Start a new bunk calculator"
          >
            {newArmed ? "sure? start fresh" : "New board"}
          </button>
        </div>
      </footer>

      <p className="sr-only">Subjects tracked: {subjects.filter((s) => isPositiveWhole(s.credits)).length}</p>
    </div>
  );
}
