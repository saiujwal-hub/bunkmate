import { useEffect, useState } from "react";
import type { Subject, SubjectDraft } from "./lib/types";
import { clampBunks, makeId, maxBunks } from "./lib/calc";
import { loadState, saveState } from "./lib/storage";
import Landing from "./components/Landing";
import SetupScreen from "./components/SetupScreen";
import CalculatorScreen from "./components/CalculatorScreen";

export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [setupDone, setSetupDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadState();
    setSubjects(stored.subjects);
    setSetupDone(stored.setupDone);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState({ setupDone, subjects });
  }, [hydrated, setupDone, subjects]);

  const generate = (drafts: SubjectDraft[]) => {
    setSubjects(
      drafts.map((d) => ({
        id: makeId(),
        name: d.name,
        credits: Number(d.credits),
        bunksUsed: 0,
      })),
    );
    setSetupDone(true);
  };

  const setUsed = (id: string, bunksUsed: number) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, bunksUsed: clampBunks(bunksUsed, maxBunks(s)) } : s)),
    );
  };

  /* An edit keeps the chalk: bunks stay as they are whenever the new max allows. */
  const editSubject = (id: string, patch: { name: string; credits: number }) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...patch, bunksUsed: clampBunks(s.bunksUsed, patch.credits * 3) }
          : s,
      ),
    );
  };

  const deleteSubject = (id: string) => {
    const next = subjects.filter((s) => s.id !== id);
    setSubjects(next);
    if (next.length === 0) setSetupDone(false); /* board empty → back to setup */
  };

  const resetCounters = () => {
    setSubjects((prev) => prev.map((s) => ({ ...s, bunksUsed: 0 })));
  };

  /* A fresh board: back to the setup form. Subjects are replaced when generated. */
  const newBoard = () => setSetupDone(false);

  return (
    <>
      {/* Chalk texture filter, drawn on once for every stroke on the board */}
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <filter id="chalkify">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
        </filter>
      </svg>

      {view === "landing" ? (
        <Landing onOpen={() => setView("app")} />
      ) : setupDone ? (
        <CalculatorScreen
          subjects={subjects}
          onSetUsed={setUsed}
          onEdit={editSubject}
          onDelete={deleteSubject}
          onResetCounters={resetCounters}
          onNewBoard={newBoard}
        />
      ) : (
        <SetupScreen onGenerate={generate} />
      )}
    </>
  );
}
