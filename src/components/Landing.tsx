import { useId } from "react";
import WriteIn from "./WriteIn";

interface Props {
  onOpen: () => void;
}

/* A chalk tally that writes itself: strokes appear one after another on load. */
function ChalkTallyStrip() {
  const GROUP = 44;
  const ink = "var(--color-chalky)";
  const ground = (
    <line
      x1={4}
      y1={132}
      x2={216}
      y2={132}
      stroke="rgba(236,233,220,0.4)"
      strokeWidth={2.4}
      strokeLinecap="round"
      className="chalk-write"
    />
  );
  const drawn: JSX.Element[] = [];
  for (let i = 0; i < 7; i++) {
    const g = Math.floor(i / 5);
    const p = i % 5;
    const delay = `${0.5 + i * 0.28}s`;
    if (p < 4) {
      const x = g * GROUP + 8 + p * 9;
      drawn.push(
        <line
          key={i}
          x1={x}
          y1={30}
          x2={x}
          y2={122}
          stroke={ink}
          strokeWidth={3.4}
          strokeLinecap="round"
          className="chalk-write"
          style={{ animationDelay: delay }}
        />,
      );
    } else {
      drawn.push(
        <path
          key={i}
          d={`M ${g * GROUP + 3} 118 L ${g * GROUP + 40} 22`}
          stroke={ink}
          strokeWidth={3.4}
          strokeLinecap="round"
          className="chalk-write"
          style={{ animationDelay: delay }}
        />,
      );
    }
  }
  return (
    <svg
      viewBox="0 0 220 140"
      className="h-auto w-[300px] max-w-full"
      role="img"
      aria-label="Chalk tally: seven bunks, five underlined by the slash"
    >
      {ground}
      {drawn}
    </svg>
  );
}

const CTA_CLASS =
  "rounded-lg border-[1.5px] border-solid border-chalky bg-chalky/10 px-6 py-2.5 font-display text-[1.1rem] text-chalky " +
  "transition-colors duration-100 hover:bg-chalky/25 focus-visible:outline-2 focus-visible:outline-dashed";
const RULE = "my-8 border-0 border-t-2 border-dotted border-chalk/15";

export default function Landing({ onOpen }: Props) {
  const sectionRef = useId();

  const scrollToHow = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(sectionRef)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="w-full font-hand text-chalk">
      {/* one board for everything: the whole pitch hangs as a single blackboard */}
      <section className="chalk-board relative mx-auto w-full max-w-[1000px] scroll-mt-6" id={sectionRef}>
        {/* ── hero ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-8 max-sm:flex-col">
          <div className="min-w-[260px] flex-1">
            <p className="chalk-write font-display text-[1.05rem] text-chalkpink">
              This is for Manipal students only.
            </p>
            <h1
              className="chalk-write mt-4 font-display text-[2.5rem] leading-[1.15] text-chalk"
              style={{ animationDelay: "0.1s" }}
            >
              Every bunk deserves a tally.
            </h1>
            <p
              className="chalk-write mt-4 max-w-[44ch] font-hand text-[1.1rem] leading-[1.55] text-chalk/70"
              style={{ animationDelay: "0.25s" }}
            >
              BunkMate is the classroom blackboard that keeps your bunk counts for you.
              Name your subjects, mark one tally each time you duck out, and the board
              holds the numbers all semester.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button type="button" className={`${CTA_CLASS} chalk-write`} style={{ animationDelay: "0.4s" }} onClick={onOpen}>
                Open the board
              </button>
              <button
                type="button"
                className="rounded-lg px-1 font-hand text-[1rem] text-chalk/60 underline decoration-dotted underline-offset-4 transition-colors duration-100 hover:text-chalk chalk-write"
                style={{ animationDelay: "0.5s" }}
                onClick={scrollToHow}
              >
                see what's on the board
              </button>
            </div>
          </div>
          <div className="px-2" style={{ filter: "url(#chalkify)" }}>
            <ChalkTallyStrip />
          </div>
        </div>

        <hr className={RULE} />

        {/* ── how it works ─────────────────────────────────────────── */}
        <section className="hero-write">
          <h2 className="chalk-write m-0 font-display text-[1.6rem] text-chalk">Three chalk lines and you're set</h2>
          <div className="mt-5">
            <WriteIn
              steps={[
                "List your subjects and how many credits each one carries.",
                "Each credit buys 3 bunks — the board works out every allowance.",
                "Tap +1 after class. The fifth stroke draws its own slash.",
              ]}
            />
          </div>
          <p className="mt-6 font-hand text-[0.95rem] text-chalk/55">
            Four chalk facts, argued from the back: totals, bunks used, bunks left, and
            your semester attendance sit at the top of the board, always.
          </p>
        </section>

        <hr className={RULE} />

        {/* ── the only maths ───────────────────────────────────────── */}
        <section>
          <h2 className="chalk-write m-0 font-display text-[1.6rem] text-chalk">The only maths you'll ever see</h2>
          <p
            className="mt-6 font-display text-[1.5rem] text-chalky max-sm:text-[1.15rem]"
            style={{ filter: "url(#chalkify)" }}
          >
            credits × 3 = what you can skip
          </p>
          <ol className="m-0 mt-6 flex list-none flex-wrap gap-x-12 gap-y-4 p-0 font-hand text-[1.05rem] text-chalk/80">
            {[
              ["1 credit", "3 bunks"],
              ["3 credits", "9 bunks"],
              ["5 credits", "15 bunks"],
            ].map(([credit, bunks], i) => (
              <li key={credit} className="chalk-write" style={i > 0 ? { animationDelay: `${i * 0.18}s` } : undefined}>
                <span className="text-chalk">{credit}</span> <span aria-hidden="true">→</span> <span className="font-display text-chalky">{bunks}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-[52ch] font-hand text-[0.95rem] leading-[1.5] text-chalk/55">
            No percentages to chase, no spreadsheets. The tallies turn pink when a subject's
            allowance is spent — that's your cue to sit in class.
          </p>
        </section>

        <hr className={RULE} />

        {/* ── the bottom bar ───────────────────────────────────────── */}
        <footer className="flex flex-wrap items-center justify-between gap-5 pb-1 max-sm:flex-col max-sm:items-start">
          <div>
            <p className="m-0 font-hand text-[1.05rem] text-chalk/80">
              Counts save on your device. No account, no sign-in.
            </p>
            <p className="m-0 mt-1 font-hand text-[0.9rem] text-chalk/45">
              made by hackathon Badcows
            </p>
          </div>
          <button type="button" className={CTA_CLASS} onClick={onOpen}>
            Open the board
          </button>
        </footer>
      </section>
    </div>
  );
}
