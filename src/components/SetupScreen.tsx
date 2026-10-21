import { useState } from "react";
import type { SubjectDraft } from "../lib/types";
import { findDuplicateName, isPositiveWhole } from "../lib/calc";
import { chalkBtn, chalkInput, chalkLabel } from "./ui";
import WriteIn from "./WriteIn";

interface Props {
  onGenerate: (drafts: SubjectDraft[]) => void;
}

let nextKey = 1;
const newDraft = (): SubjectDraft => ({
  key: `d${nextKey++}`,
  name: "",
  credits: "",
});

export default function SetupScreen({ onGenerate }: Props) {
  const [count, setCount] = useState("");
  const [rows, setRows] = useState<SubjectDraft[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [countError, setCountError] = useState("");

  const applyCount = (n: number) => {
    setRows((prev) => {
      if (n === prev.length) return prev;
      if (n < prev.length) return prev.slice(0, n);
      const extra = Array.from({ length: n - prev.length }, () => newDraft());
      return [...prev, ...extra];
    });
  };

  const listSubjects = () => {
    const parsed = Number(count);
    if (count.trim() === "" || !isPositiveWhole(parsed)) {
      setCountError("Give me a whole number of subjects — 1 or more.");
      return;
    }
    setCountError("");
    applyCount(Math.min(parsed, 30));
  };

  const setField = (i: number, field: keyof Omit<SubjectDraft, "key">, value: string) => {
    setRows((prev) => prev.map((r, rix) => (rix === i ? { ...r, [field]: value } : r)));
    setErrors((prev) => {
      if (!prev[i]) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };

  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, rix) => rix !== i));
    setErrors((prev) => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const rix = Number(k);
        if (rix !== i) next[rix > i ? rix - 1 : rix] = v;
      }
      return next;
    });
  };

  const generate = () => {
    const rowErrors: Record<number, string> = {};
    rows.forEach((r, i) => {
      if (!r.name.trim()) {
        rowErrors[i] = "Every subject needs a name.";
      }
      const credits = Number(r.credits);
      if (!isPositiveWhole(credits)) rowErrors[i] = "Credits must be a whole number, 1 or more.";
    });

    const dup = findDuplicateName(rows.map((r) => ({ name: r.name })));
    if (dup) rowErrors[rows.findIndex((r) => r.name.trim().toLowerCase() === dup.toLowerCase())] ??= `"${dup}" appears twice — each name once, please.`;

    if (rows.length === 0) {
      setCountError("List your subjects first — how many do you have?");
      return;
    }
    if (Object.keys(rowErrors).length > 0) {
      setErrors(rowErrors);
      return;
    }
    setErrors({});
    onGenerate(rows.map((r) => ({ ...r, name: r.name.trim() })));
  };

  /* The max each row would create, written in ghost chalk up front. */
  const preview = (r: SubjectDraft) => {
    const credits = Number(r.credits);
    if (isPositiveWhole(credits)) return `${credits * 3}`;
    return null;
  };

  return (
    <div className="chalk-board relative w-full max-w-[880px] text-chalk">
      <header className="mb-6">
        <h1 className="m-0 font-display text-3xl text-chalk">Set up your board</h1>
        <p className="mt-2 max-w-[52ch] font-hand text-[1.05rem] text-chalk/70">
          Before the tallies can start, the board needs a seating plan. Answer three small
          questions and I'll chalk up the rest.
        </p>
      </header>

      <WriteIn
        steps={[
          "How many subjects do you have?",
          "What is each one called?",
          "How many credits is each one worth?",
        ]}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => {
            setCount(e.target.value.replace(/[^\d]/, ""));
            setCountError("");
          }}
          onBlur={(e) => {
            if (isPositiveWhole(Number(e.target.value))) listSubjects();
          }}
          onKeyDown={(e) => e.key === "Enter" && listSubjects()}
          aria-label="How many subjects do you have?"
          placeholder="7"
          className={`${chalkInput} w-20 text-center`}
        />
        <button type="button" className={chalkBtn} onClick={listSubjects}>
          List them for me
        </button>
      </div>
      {countError && <p className="mt-2 font-hand text-[0.95rem] text-chalkpink">{countError}</p>}

      {rows.length > 0 && (
        <ol className="m-0 mt-8 list-none space-y-1 p-0">
          {rows.map((r, i) => (
            <li
              key={r.key}
              className="chalk-write flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-dotted border-chalk/10 py-2.5"
            >
              <span className="font-display text-[0.95rem] text-chalky">{i + 1}.</span>
              <input
                type="text"
                value={r.name}
                onChange={(e) => setField(i, "name", e.target.value)}
                aria-label={`Subject ${i + 1} name`}
                placeholder="subject name"
                className={`${chalkInput} min-w-[140px] flex-1 basis-[220px]`}
              />
              <label className="flex items-center gap-1.5">
                <span className={chalkLabel}>credits</span>
                <input
                  type="number"
                  min={1}
                  value={r.credits}
                  onChange={(e) => setField(i, "credits", e.target.value)}
                  aria-label={`Subject ${i + 1} credits`}
                  placeholder="3"
                  className={`${chalkInput} w-16 text-center`}
                />
              </label>
              <span className="w-10 text-center font-hand text-[0.9rem] text-chalk/40">
                {preview(r) ? `→ ${preview(r)}` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className={`${chalkBtn} border-transparent px-1.5 text-chalk/40 hover:text-chalk`}
                aria-label={`Remove subject ${i + 1} from the list`}
              >
                ✕
              </button>
              {errors[i] && (
                <p className="w-full font-hand text-[0.9rem] text-chalkpink">{errors[i]}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 && (
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setRows((prev) => [...prev, newDraft()]);
              setCount(String(rows.length + 1));
            }}
            className={chalkBtn}
          >
            + add another subject
          </button>
          <button
            type="button"
            onClick={generate}
            className="rounded-lg border-[1.5px] border-solid border-chalky bg-chalky/10 px-5 py-2 font-display text-[1.05rem] text-chalky transition-colors duration-100 hover:bg-chalky/20"
          >
            Generate My Bunk Calculator
          </button>
        </div>
      )}

      <footer className="mt-10 -mb-1 flex items-baseline justify-between gap-4 font-hand text-[0.85rem] text-chalk/45 max-sm:flex-col">
        <span>Max allowed comes out as credits × 3. Change a number anytime on the board.</span>
        <span>nothing saves until you generate</span>
      </footer>
    </div>
  );
}
