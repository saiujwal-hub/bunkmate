import { useEffect, useRef, useState } from "react";
import type { Subject } from "../lib/types";
import { findDuplicateName, isPositiveWhole, maxBunks } from "../lib/calc";
import TallyStrokes from "./TallyStrokes";
import { chalkBtn, chalkBtnPlain, chalkBtnDangerArmed, chalkInput, chalkLabel } from "./ui";

export interface NotifyFn {
  (tone: "warn" | "calm", text: string): void;
}

interface Props {
  subject: Subject;
  /** Every current subject name (with the owner's id as ignoreKey) for duplicate checks. */
  allNames: Array<{ name: string; ignoreKey?: string }>;
  onSetUsed: (id: string, bunksUsed: number) => void;
  onEdit: (id: string, patch: { name: string; credits: number }) => void;
  onDelete: (id: string) => void;
  notify: NotifyFn;
}

export default function SubjectRow({ subject, allNames, onSetUsed, onEdit, onDelete, notify }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: subject.name, credits: String(subject.credits) });
  const [editError, setEditError] = useState("");

  const [usedText, setUsedText] = useState(String(subject.bunksUsed));
  useEffect(() => {
    setUsedText(String(subject.bunksUsed));
  }, [subject.bunksUsed]);

  const max = maxBunks(subject);
  const remaining = max - subject.bunksUsed;
  const isDone = remaining <= 0;

  const posInt = (v: string) => isPositiveWhole(Number(v));

  /* ---- tracking controls --------------------------------------------- */

  const mark = () => {
    if (subject.bunksUsed >= max) {
      notify("warn", `${subject.name} is maxed out — ${max} bunks is the whole allowance, nothing past it.`);
      return;
    }
    onSetUsed(subject.id, subject.bunksUsed + 1);
  };

  const undo = () => {
    if (subject.bunksUsed <= 0) {
      notify("calm", `${subject.name} sits at zero — there's nothing to take back.`);
      return;
    }
    onSetUsed(subject.id, subject.bunksUsed - 1);
  };

  const commitUsed = () => {
    if (usedText.trim() === "") {
      notify("warn", "Bunks used is a whole number — write one in.");
      setUsedText(String(subject.bunksUsed));
      return;
    }
    const n = Number(usedText);
    if (!Number.isInteger(n) || n < 0) {
      notify("warn", "Bunks used is a whole number — write one in.");
      setUsedText(String(subject.bunksUsed));
      return;
    }
    if (n > max) {
      notify("warn", `${subject.name} allows ${max} bunks in total, so nothing past that.`);
      setUsedText(String(subject.bunksUsed));
      return;
    }
    onSetUsed(subject.id, n);
  };

  /* ---- editing -------------------------------------------------------- */

  const startEdit = () => {
    setDraft({ name: subject.name, credits: String(subject.credits) });
    setEditError("");
    setEditing(true);
  };

  const saveEdit = () => {
    if (!draft.name.trim()) {
      setEditError("Every subject needs a name.");
      return;
    }
    if (!posInt(draft.credits)) {
      setEditError("Credits must be a whole number, 1 or more.");
      return;
    }
    const dup = findDuplicateName(
      allNames.map((n) => (n.ignoreKey === subject.id ? { ...n, ignoreKey: undefined } : n)),
    );
    if (dup) {
      setEditError(`"${dup}" is already on the board — each name once.`);
      return;
    }
    const nextMax = Number(draft.credits) * 3;
    if (subject.bunksUsed > nextMax) {
      setEditError(
        `You've already used ${subject.bunksUsed} bunks — that beats the new allowance of ${nextMax}. ` +
          `Lower "bunks used" a bit, or raise the credits first.`,
      );
      return;
    }
    onEdit(subject.id, {
      name: draft.name.trim(),
      credits: Number(draft.credits),
    });
    setEditing(false);
  };

  /* ---- delete: chalk the name out, two taps --------------------------- */

  const [armed, setArmed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismantle = () => {
    if (armed) {
      if (armTimer.current) clearTimeout(armTimer.current);
      setArmed(false);
      onDelete(subject.id);
    } else {
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 2600);
    }
  };
  useEffect(() => () => {
    if (armTimer.current) clearTimeout(armTimer.current);
  }, []);

  if (editing) {
    return (
      <li className="border-b-2 border-dotted border-chalk/10 py-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            aria-label="Edit subject name"
            className={`${chalkInput} min-w-[140px] flex-1 basis-[180px]`}
          />
          <label className="flex items-center gap-1.5">
            <span className={chalkLabel}>credits</span>
            <input
              type="number"
              min={1}
              value={draft.credits}
              onChange={(e) => setDraft({ ...draft, credits: e.target.value })}
              aria-label={`Edit credits for ${subject.name}`}
              className={`${chalkInput} w-16 text-center`}
            />
          </label>
          <span className="font-hand text-[0.9rem] text-chalk/40">
            used stays at {subject.bunksUsed} → max {Number(draft.credits) * 3 || "—"}
          </span>
          <div className="flex gap-2">
            <button type="button" className={chalkBtn} onClick={saveEdit}>save</button>
            <button type="button" className={chalkBtnPlain} onClick={() => setEditing(false)}>cancel</button>
          </div>
        </div>
        {editError && <p className="mt-2 font-hand text-[0.95rem] text-chalkpink">{editError}</p>}
      </li>
    );
  }

  return (
    <li
      className={`grid grid-cols-1 items-center gap-y-2.5 border-b-2 border-dotted border-chalk/10 py-3.5
        sm:grid-cols-[minmax(170px,236px)_minmax(150px,auto)_auto_1fr] sm:gap-x-5 ${isDone ? "row-done" : ""}`}
    >
      <div className="sm:pr-2">
        <h3 className="m-0 font-display text-[1.02rem] font-normal leading-[1.35] text-chalk">
          {subject.name}
        </h3>
        <small className="block font-hand text-[0.82rem] text-chalk/55">
          {subject.credits} credit{subject.credits === 1 ? "" : "s"} — max {max}
        </small>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <TallyStrokes subject={subject} used={subject.bunksUsed} />
        <label className="flex shrink-0 items-center gap-1.5">
          <span className={chalkLabel}>used</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            value={usedText}
            onChange={(e) => setUsedText(e.target.value.replace(/[^\d]/, ""))}
            onBlur={commitUsed}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label={`Bunks used for ${subject.name}`}
            className={`${chalkInput} w-14 text-center`}
          />
        </label>
      </div>

      <div className="flex flex-row items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
        <span className="font-hand text-[0.82rem] text-chalk/55">remaining</span>
        <span
          className={`font-display text-[1.06rem] ${isDone ? "text-chalkpink" : "text-chalky"}`}
          aria-live="polite"
        >
          {isDone ? "none left, attend!" : `${remaining} left`}
        </span>
      </div>

      <div className="flex gap-1.5 sm:justify-end">
        <button type="button" className={chalkBtn} onClick={undo} aria-label={`Undo one bunk for ${subject.name}`}>
          −1
        </button>
        <button type="button" className={chalkBtn} onClick={mark} aria-label={`Record one bunked class for ${subject.name}`}>
          +1
        </button>
        <button type="button" className={chalkBtnPlain} onClick={startEdit} aria-label={`Edit ${subject.name}`}>
          edit
        </button>
        <button
          type="button"
          onClick={dismantle}
          className={`${armed ? chalkBtnDangerArmed : ""} ${chalkBtnPlain}`}
          aria-label={`Delete ${subject.name}`}
        >
          {armed ? "sure?" : "delete"}
        </button>
      </div>
    </li>
  );
}
