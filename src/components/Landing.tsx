import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import WriteIn from "./WriteIn";
import GaugeDial from "./GaugeDial";

interface Props {
  onOpen: () => void;
}

/* Synthesizes realistic soft chalk friction sound via Web Audio API */
function playChalkSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2200;
    filter.Q.value = 1.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch {
    /* Silent fallback */
  }
}

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border-[2px] border-solid border-chalky " +
  "bg-chalky/15 px-7 py-3 font-display text-[1.12rem] font-medium text-chalky shadow-[0_0_16px_rgba(239,210,138,0.25)] " +
  "transition-all duration-150 hover:bg-chalky/30 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(239,210,138,0.45)] " +
  "focus-visible:outline-2 focus-visible:outline-dashed active:scale-[0.98] cursor-pointer";

/* Deterministic hand jitter so chalk strokes don't lean mechanically */
const TILTS = [-1.1, 0.7, -0.4, 1.2, -0.8];

interface StrokesProps {
  count: number;
  base?: number;
  step?: number;
  ariaLabel: string;
  width?: number;
  inkColor?: string;
}

function ChalkStrokes({
  count,
  base = 0.5,
  step = 0.16,
  ariaLabel,
  width,
  inkColor = "var(--color-chalky)",
}: StrokesProps) {
  const first = useRef(true);
  const prev = useRef(count);
  const staggerFrom = first.current ? Infinity : prev.current;

  useEffect(() => {
    first.current = false;
    prev.current = count;
  }, [count]);

  const GROUP = 46;
  const groups = Math.ceil(Math.max(count, 1) / 5) || 1;
  const vbW = width ?? groups * GROUP + 16;
  const vbH = 140;

  const strokes: JSX.Element[] = [];
  for (let i = 0; i < count; i++) {
    const g = Math.floor(i / 5);
    const p = i % 5;
    const delay = i >= staggerFrom ? "0.03s" : `${base + i * step}s`;
    const tilt = TILTS[i % TILTS.length];
    if (p < 4) {
      const x = g * GROUP + 9 + p * 9 + tilt;
      strokes.push(
        <line
          key={i}
          x1={x}
          y1={28}
          x2={x + tilt}
          y2={124}
          stroke={inkColor}
          strokeWidth={4.2}
          strokeLinecap="round"
          pathLength={100}
          className="stroke-draw"
          style={{ animationDelay: delay }}
        />,
      );
    } else {
      strokes.push(
        <path
          key={i}
          d={`M ${g * GROUP + 3} 122 C ${g * GROUP + 15} 84, ${g * GROUP + 30} 56, ${g * GROUP + 45} 18`}
          stroke={inkColor}
          strokeWidth={4.4}
          strokeLinecap="round"
          fill="none"
          pathLength={100}
          className="stroke-draw"
          style={{ animationDelay: delay }}
        />,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="block h-[115px] w-auto max-w-full mx-auto"
      role="img"
      aria-label={ariaLabel}
    >
      <line
        x1={2}
        y1={134}
        x2={vbW - 2}
        y2={134}
        stroke="rgba(236,233,220,0.3)"
        strokeWidth={2.4}
        strokeLinecap="round"
        pathLength={100}
        className="stroke-draw"
        style={{ animationDelay: "0.2s" }}
      />
      {strokes}
    </svg>
  );
}

const HEADLINE = ["Every", "bunk", "deserves", "a", "tally."];

function ChalkHeadline() {
  let tick = 0;
  return (
    <h1 className="m-0 font-display text-[2.5rem] leading-[1.25] text-chalk sm:text-[3.2rem]">
      {HEADLINE.map((word, wIdx) => (
        <span
          key={word}
          className={`inline-block whitespace-nowrap ${wIdx < HEADLINE.length - 1 ? "mr-3 sm:mr-4" : ""}`}
        >
          {word.split("").map((ch) => (
            <span
              key={`${word}-${tick}`}
              className="chalk-write inline-block text-chalk"
              style={{
                animationDelay: `${0.3 + tick++ * 0.045}s`,
                textShadow: "0 0 10px rgba(236,233,220,0.35)",
              }}
            >
              {ch}
            </span>
          ))}
          {wIdx < HEADLINE.length - 1 && " "}
        </span>
      ))}
    </h1>
  );
}

const DUST = [
  { left: "7%", delay: 1.6, drift: 6 },
  { left: "18%", delay: 1.9, drift: -4 },
  { left: "32%", delay: 1.5, drift: 5 },
  { left: "48%", delay: 2.1, drift: -5 },
  { left: "62%", delay: 1.8, drift: 4 },
  { left: "76%", delay: 2.3, drift: -6 },
  { left: "89%", delay: 1.7, drift: 5 },
];

function ChalkDust() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-[-32px] h-[46px] overflow-hidden"
    >
      {DUST.map((d, i) => (
        <span
          key={i}
          className="dust-mote"
          style={
            {
              left: d.left,
              animationDelay: `${d.delay}s`,
              "--drift": `${d.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ── Interactive Live Blackboard Sandbox ──────────────────────────── */

interface CoursePreset {
  name: string;
  credits: number;
}

const DEMO_PRESETS: CoursePreset[] = [
  { name: "Communication C", credits: 3 },
  { name: "Data Structures", credits: 4 },
  { name: "Engineering Maths", credits: 3 },
  { name: "Chemistry Lab", credits: 1 },
];

function DemoRow({ soundEnabled }: { soundEnabled: boolean }) {
  const [selectedCourse, setSelectedCourse] = useState<CoursePreset>(DEMO_PRESETS[0]);
  const [used, setUsed] = useState(4);
  const allowance = selectedCourse.credits * 3;
  const left = allowance - used;
  const groupCount = Math.max(Math.ceil(allowance / 5), 1);
  const slateWidth = groupCount * 46 + 24;

  const handleSelectCourse = (course: CoursePreset) => {
    setSelectedCourse(course);
    setUsed(Math.min(used, course.credits * 3));
    if (soundEnabled) playChalkSound();
  };

  const bump = (n: number) => {
    const next = Math.min(Math.max(0, used + n), allowance);
    setUsed(next);
    if (soundEnabled) playChalkSound();
  };

  const resetAll = () => {
    setUsed(0);
    if (soundEnabled) playChalkSound();
  };

  const btn =
    "rounded-xl border-[1.5px] border-solid border-chalky/80 bg-chalky/10 px-4 py-1.5 font-display text-[1.05rem] text-chalky " +
    "transition-all duration-120 hover:bg-chalky/25 hover:scale-105 focus-visible:outline-2 focus-visible:outline-dashed " +
    "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 active:scale-95 cursor-pointer";

  const statusNote =
    left === 0
      ? "🚨 Pink Alert: Allowance fully spent! You must attend every class."
      : left <= 2
        ? "⚠️ Warning: Attendance dangerously close to 75% cutoff."
        : left <= 5
          ? "☕ Halfway mark: You've got room, but save some for fest season."
          : "✨ Relax: Comfortable attendance buffer in hand.";

  return (
    <section id="demo" className="scroll-mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <span className="font-mono text-[0.8rem] uppercase tracking-widest text-chalky/80">
            [ Interactive Blackboard Console ]
          </span>
          <h2 className="chalk-write m-0 mt-1 font-display text-[1.9rem] text-chalk sm:text-[2.2rem]">
            First, try the chalk
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-chalk/25 bg-chalk/5 px-3 py-1 font-hand text-[0.85rem] text-chalk/75">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Blackboard Sandbox</span>
        </div>
      </div>

      <p
        className="chalk-write mt-3 max-w-[58ch] font-hand text-[1.15rem] leading-[1.6] text-chalk/75"
        style={{ animationDelay: "0.15s" }}
      >
        Communication C carries 3 credits — 9 bunks. Tap +1 and watch the stroke draw
        itself. Mentally, you're already outside the classroom.
      </p>

      {/* Preset course selector */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <span className="font-hand text-[0.95rem] text-chalk/50">Pick a course:</span>
        {DEMO_PRESETS.map((course) => {
          const isSelected = selectedCourse.name === course.name;
          return (
            <button
              key={course.name}
              type="button"
              onClick={() => handleSelectCourse(course)}
              className={`rounded-full px-3.5 py-1 font-hand text-[0.92rem] transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "border border-chalky bg-chalky/20 text-chalky shadow-[0_0_8px_rgba(239,210,138,0.3)]"
                  : "border border-dashed border-chalk/30 bg-chalk/5 text-chalk/70 hover:border-chalk/60 hover:text-chalk"
              }`}
            >
              {course.name} <span className="opacity-75">({course.credits} cr)</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Slate Box */}
      <div className="mt-6 grid grid-cols-1 gap-8 rounded-2xl border-[1.5px] border-dashed border-chalk/35 bg-black/25 p-6 backdrop-blur-sm md:grid-cols-12 md:items-center">
        {/* Course Slate */}
        <div className="md:col-span-7">
          <div
            className="rounded-xl border border-dashed border-chalk/35 bg-[#17251d]/70 p-5 shadow-[inset_0_0_24px_rgba(0,0,0,0.5)]"
            style={{ filter: "url(#chalkify)" }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-chalk/20 pb-3">
              <div>
                <p className="m-0 font-display text-[1.25rem] text-chalk">
                  {selectedCourse.name}
                </p>
                <p className="m-0 mt-0.5 font-hand text-[0.85rem] text-chalk/60">
                  Room 302 · Slot 8:00 AM
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-md border border-chalky/40 bg-chalky/10 px-2.5 py-0.5 font-display text-[0.95rem] text-chalky">
                  {selectedCourse.credits} credits
                </span>
                <p className="m-0 mt-1 font-mono text-[0.78rem] text-chalk/60">
                  {allowance} bunks limit
                </p>
              </div>
            </div>

            {/* Chalk Strokes Tally with fixed allowance width */}
            <div className="my-4 flex items-center justify-center min-h-[120px] w-full" data-testid="demo-tally">
              <ChalkStrokes
                count={used}
                width={slateWidth}
                inkColor={left === 0 ? "var(--color-chalkpink)" : "var(--color-chalky)"}
                ariaLabel={
                  used === 0
                    ? "No bunks marked yet"
                    : `Chalk tally: ${used} bunks marked`
                }
              />
            </div>

            {/* Count & Status */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-chalk/20 pt-3">
              <p className="m-0 font-hand text-[1.05rem]" data-testid="demo-count">
                {used === 0 ? (
                  <span className="text-chalk/60">nothing marked</span>
                ) : left === 0 ? (
                  <span className="font-medium text-chalkpink">
                    {allowance} of {allowance} used · none left, attend!
                  </span>
                ) : (
                  <span className="text-chalk/90">
                    {used} of {allowance} used · {left} left
                  </span>
                )}
              </p>

              <span
                className={`font-mono text-[0.78rem] tracking-wider uppercase ${
                  left === 0
                    ? "text-chalkpink"
                    : left <= 2
                      ? "text-amber-300"
                      : "text-emerald-300"
                }`}
              >
                {left === 0 ? "⚠️ ZERO REMAINING" : `${Math.round((left / allowance) * 100)}% SAFETY`}
              </span>
            </div>
          </div>

          <p className="m-0 mt-3 font-hand text-[0.95rem] text-chalk/65 italic">
            {statusNote}
          </p>
        </div>

        {/* Dial & Controls */}
        <div className="flex flex-col items-center justify-center gap-5 md:col-span-5 md:border-l md:border-dashed md:border-chalk/20 md:pl-6">
          <GaugeDial
            percent={(left / allowance) * 100}
            big={`${left} left`}
            small="of this subject's allowance"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className={btn}
              onClick={() => bump(-1)}
              disabled={used === 0}
              aria-label="Subtract one bunk"
            >
              −1
            </button>
            <button
              type="button"
              className={`${btn} bg-chalky/20 font-bold px-5 text-[1.15rem] shadow-[0_0_12px_rgba(239,210,138,0.2)]`}
              onClick={() => bump(+1)}
              disabled={left === 0}
              aria-label="Add one bunk"
            >
              +1
            </button>
            <button
              type="button"
              className="rounded px-2 font-hand text-[0.95rem] text-chalk/50 underline decoration-dotted underline-offset-4 transition-colors hover:text-chalk focus-visible:outline-2 focus-visible:outline-dashed cursor-pointer"
              onClick={resetAll}
            >
              erase all
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const RULE = "my-10 border-0 border-t-2 border-dotted border-chalk/20";

/* ── Main Landing Component ───────────────────────────────────────── */

export default function Landing({ onOpen }: Props) {
  const [activeChalkColor, setActiveChalkColor] = useState<string>("chalky");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customCredits, setCustomCredits] = useState<number>(3);

  const heroInk =
    activeChalkColor === "chalkpink"
      ? "var(--color-chalkpink)"
      : activeChalkColor === "chalk"
        ? "var(--color-chalk)"
        : "var(--color-chalky)";

  const scrollToSection = (id: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleChalkStickClick = (color: string) => {
    setActiveChalkColor(color);
    if (soundEnabled) playChalkSound();
  };

  return (
    <div className="w-full font-hand text-chalk">
      {/* ── Main Slate Blackboard Container ────────────────────────── */}
      <section className="chalk-board relative mx-auto w-full max-w-[1080px]">
        {/* Brass corner brackets on wood frame */}
        <div className="brass-bracket brass-tl" aria-hidden="true" />
        <div className="brass-bracket brass-tr" aria-hidden="true" />
        <div className="brass-bracket brass-bl" aria-hidden="true" />
        <div className="brass-bracket brass-br" aria-hidden="true" />

        {/* Faint eraser smudges & blackboard slate grid texture */}
        <div aria-hidden="true" className="board-smudges pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="slate-grid pointer-events-none absolute inset-0 opacity-40" />

        {/* ── Classroom Header Banner ─────────────────────────────────── */}
        <header className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-chalk/20 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-chalk/40 bg-chalk/10 font-display text-sm text-chalky"
              aria-hidden="true"
            >
              ✎
            </span>
            <div>
              <p className="m-0 font-display text-[0.98rem] tracking-wide text-chalk">
                BunkMate <span className="text-chalky font-mono text-[0.8rem]">· v2.0</span>
              </p>
              <p className="m-0 font-hand text-[0.82rem] text-chalk/55">
                Manipal Institute of Technology · Attendance Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-lg border border-dashed border-chalk/30 bg-chalk/5 px-2.5 py-1 font-hand text-[0.85rem] text-chalk/75 transition-colors hover:text-chalk cursor-pointer"
              title="Toggle chalk sound effect"
            >
              {soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-chalky/80 bg-chalky/10 px-3.5 py-1 font-display text-[0.92rem] text-chalky transition-all hover:bg-chalky/25 cursor-pointer"
              onClick={onOpen}
            >
              Open the board →
            </button>
          </div>
        </header>

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
          <div className="relative min-w-[280px] flex-1">
            {/* Manipal Exclusive Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-chalkpink/40 bg-chalkpink/10 px-3.5 py-1 mb-3">
              <span className="h-2 w-2 rounded-full bg-chalkpink animate-pulse" />
              <p className="chalk-write m-0 font-display text-[0.92rem] tracking-wide text-chalkpink">
                This is for Manipal students only.
              </p>
            </div>

            {/* Handwritten Animated Headline */}
            <div className="relative mt-2">
              <ChalkHeadline />
              <ChalkDust />
            </div>

            {/* Value Proposition Copy */}
            <p
              className="chalk-write mt-6 max-w-[48ch] font-hand text-[1.2rem] leading-[1.6] text-chalk/75"
              style={{ animationDelay: "1.3s" }}
            >
              BunkMate keeps your bunk tally on the classroom blackboard. Name your
              subjects, mark one stroke each time you duck out, and the board holds
              the numbers all semester — you just stop when the pink comes out.
            </p>

            {/* Quick Feature Badges */}
            <div
              className="chalk-write mt-5 flex flex-wrap gap-2.5 font-hand text-[0.92rem] text-chalk/70"
              style={{ animationDelay: "1.45s" }}
            >
              <span className="rounded-md border border-dashed border-chalk/25 bg-chalk/5 px-2.5 py-1">
                ✓ Credits × 3 Rule
              </span>
              <span className="rounded-md border border-dashed border-chalk/25 bg-chalk/5 px-2.5 py-1">
                ✓ 100% On-Device & Private
              </span>
              <span className="rounded-md border border-dashed border-chalk/25 bg-chalk/5 px-2.5 py-1">
                ✓ Zero Login or Setup Hassle
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className={`${CTA_CLASS} chalk-write`}
                style={{ animationDelay: "1.6s" }}
                onClick={() => {
                  if (soundEnabled) playChalkSound();
                  onOpen();
                }}
              >
                Open the board
              </button>
              <button
                type="button"
                className="chalk-write rounded px-2 font-hand text-[1.05rem] text-chalk/65 underline decoration-dotted underline-offset-4 transition-colors duration-100 hover:text-chalk focus-visible:outline-2 focus-visible:outline-dashed cursor-pointer"
                style={{ animationDelay: "1.7s" }}
                onClick={() => scrollToSection("demo")}
              >
                see what's on the board ↓
              </button>
            </div>
          </div>

          {/* Hero Chalk Tally Display Card */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-chalk/35 bg-black/20 p-6 md:w-[280px]"
            style={{ filter: "url(#chalkify)" }}
            data-testid="hero-tally"
          >
            <div className="flex items-center justify-between w-full border-b border-dashed border-chalk/20 pb-2">
              <span className="font-mono text-[0.78rem] uppercase tracking-wider text-chalky/80">
                Chalk History
              </span>
              <span className="font-mono text-[0.75rem] text-emerald-400">
                ● Active
              </span>
            </div>
            <div className="my-3 flex items-center justify-center min-h-[115px] w-[160px] max-w-full">
              <ChalkStrokes
                count={7}
                width={130}
                base={0.4}
                step={0.14}
                inkColor={heroInk}
                ariaLabel="Chalk tally: seven bunks, five underlined by the slash"
              />
            </div>
            <p className="m-0 mt-1 text-center font-hand text-[0.95rem] text-chalk/70">
              7 bunks marked · 5 underlined by slash
            </p>
          </div>
        </div>

        <hr className={RULE} />

        {/* ── Interactive Live Blackboard Sandbox ─────────────────────── */}
        <DemoRow soundEnabled={soundEnabled} />

        <hr className={RULE} />

        {/* ── The Only Maths You'll Ever See ──────────────────────────── */}
        <section id="the-maths" className="scroll-mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <span className="font-mono text-[0.8rem] uppercase tracking-widest text-chalky/80">
                [ Zero Percentage Headache ]
              </span>
              <h2 className="chalk-write m-0 mt-1 font-display text-[1.9rem] text-chalk sm:text-[2.2rem]">
                The only maths you'll ever see
              </h2>
            </div>
          </div>

          {/* The Big Golden Formula Banner */}
          <div
            className="mt-6 rounded-2xl border-[2px] border-dashed border-chalky/40 bg-chalky/5 p-6 text-center shadow-[inset_0_0_24px_rgba(239,210,138,0.1)]"
            style={{ filter: "url(#chalkify)" }}
          >
            <p className="m-0 font-display text-[2.2rem] text-chalky max-sm:text-[1.5rem]">
              credits × 3 = what you can skip
            </p>
            <p className="m-0 mt-2 font-hand text-[1.05rem] text-chalk/75">
              Derived from Manipal's 75% attendance requirement across a 14-week semester.
            </p>
          </div>

          {/* Interactive Credit Explorer Slider */}
          <div className="mt-6 rounded-xl border border-dashed border-chalk/30 bg-black/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="m-0 font-display text-[1.1rem] text-chalk">
                  Interactive Formula Inspector
                </p>
                <p className="m-0 font-hand text-[0.92rem] text-chalk/60">
                  Slide credits to test the leeway on any course
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-chalky">Credits: {customCredits}</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={customCredits}
                  onChange={(e) => {
                    setCustomCredits(Number(e.target.value));
                    if (soundEnabled) playChalkSound();
                  }}
                  className="h-2 w-32 cursor-pointer accent-chalky"
                  aria-label="Adjust course credits"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-chalk/20 pt-4 text-center">
              <div>
                <p className="m-0 font-mono text-[0.8rem] uppercase text-chalk/50">Credits</p>
                <p className="m-0 mt-1 font-display text-[1.4rem] text-chalk">{customCredits}</p>
              </div>
              <div className="border-x border-dashed border-chalk/20">
                <p className="m-0 font-mono text-[0.8rem] uppercase text-chalk/50">Total Classes</p>
                <p className="m-0 mt-1 font-display text-[1.4rem] text-chalk">~{customCredits * 14}</p>
              </div>
              <div>
                <p className="m-0 font-mono text-[0.8rem] uppercase text-chalk/50">Allowed Bunks</p>
                <p className="m-0 mt-1 font-display text-[1.4rem] text-chalky">
                  {customCredits * 3} bunks
                </p>
              </div>
            </div>
          </div>

          {/* Standard Credit Reference List */}
          <ol className="m-0 mt-6 grid grid-cols-1 gap-4 p-0 list-none sm:grid-cols-3 font-hand text-[1.1rem]">
            {[
              {
                credit: "1 credit",
                bunks: "3 bunks",
                desc: "Labs, workshops & seminars",
              },
              {
                credit: "3 credits",
                bunks: "9 bunks",
                desc: "Standard lecture courses & electives",
              },
              {
                credit: "5 credits",
                bunks: "15 bunks",
                desc: "Intensive core engineering subjects",
              },
            ].map(({ credit, bunks, desc }, i) => (
              <li
                key={credit}
                className="chalk-write rounded-xl border border-dashed border-chalk/25 bg-[#17251d]/50 p-4 transition-colors hover:border-chalky/40"
                style={i > 0 ? { animationDelay: `${i * 0.15}s` } : undefined}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[1.15rem] text-chalk">{credit}</span>
                  <span className="font-display text-[1.25rem] text-chalky">{bunks}</span>
                </div>
                <p className="m-0 mt-2 font-hand text-[0.88rem] text-chalk/55">{desc}</p>
              </li>
            ))}
          </ol>

          {/* SLCM Portal vs BunkMate comparison */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-dashed border-chalkpink/30 bg-chalkpink/5 p-4">
              <p className="m-0 font-display text-[1.05rem] text-chalkpink">
                ✕ The SLCM Portal Routine
              </p>
              <p className="m-0 mt-2 font-hand text-[0.95rem] leading-[1.5] text-chalk/65">
                Logging in on campus Wi-Fi at 7:56 AM, solving captchas, finding your subject page,
                doing fraction math in your head, and still worrying if you missed an attendance window.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-chalky/30 bg-chalky/5 p-4">
              <p className="m-0 font-display text-[1.05rem] text-chalky">
                ✓ The BunkMate Blackboard
              </p>
              <p className="m-0 mt-2 font-hand text-[0.95rem] leading-[1.5] text-chalk/75">
                One look at your blackboard slate: 4 chalk marks left. Total peace of mind.
                Turn over and get your sleep.
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-[60ch] font-hand text-[1.05rem] leading-[1.6] text-chalk/65">
            No percentages to chase, no spreadsheets. The tallies turn pink when a
            subject's allowance is spent — that's your cue to sit in class.
          </p>
        </section>

        <hr className={RULE} />

        {/* ── Three Chalk Lines and You're Set ────────────────────────── */}
        <section id="how-to" className="scroll-mt-8">
          <span className="font-mono text-[0.8rem] uppercase tracking-widest text-chalky/80">
            [ How It Works ]
          </span>
          <h2 className="chalk-write m-0 mt-1 font-display text-[1.9rem] text-chalk sm:text-[2.2rem]">
            Three chalk lines and you're set
          </h2>

          <div className="mt-6">
            <WriteIn
              steps={[
                "List your subjects and how many credits each one carries.",
                "Each credit buys 3 bunks — the board works out every allowance.",
                "Tap +1 after class. The fifth stroke draws its own slash.",
              ]}
            />
          </div>

          {/* Visual Step Illustration Cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-dashed border-chalk/25 bg-black/20 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-chalk/30 bg-chalk/10 font-display text-lg text-chalky">
                1
              </div>
              <h3 className="m-0 mt-3 font-display text-[1.15rem] text-chalk">Set Up in Seconds</h3>
              <p className="m-0 mt-2 font-hand text-[0.95rem] text-chalk/65 leading-[1.5]">
                Enter your subject list and credit weights once at the start of semester. Up to 30 subjects.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-chalk/25 bg-black/20 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-chalk/30 bg-chalk/10 font-display text-lg text-chalky">
                2
              </div>
              <h3 className="m-0 mt-3 font-display text-[1.15rem] text-chalk">The Board Does the Math</h3>
              <p className="m-0 mt-2 font-hand text-[0.95rem] text-chalk/65 leading-[1.5]">
                Every allowance is automatically computed as credits × 3. Overall attendance gauge tracks in real time.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-chalk/25 bg-black/20 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-chalk/30 bg-chalk/10 font-display text-lg text-chalky">
                3
              </div>
              <h3 className="m-0 mt-3 font-display text-[1.15rem] text-chalk">Tap & Sleep Easy</h3>
              <p className="m-0 mt-2 font-hand text-[0.95rem] text-chalk/65 leading-[1.5]">
                One tap from outside class. Chalk draws its stroke. You know exactly when you have to attend.
              </p>
            </div>
          </div>

          <p className="mt-6 font-hand text-[1rem] text-chalk/60">
            Four chalk facts, argued from the back: subjects, bunks used, bunks left, and
            your semester attendance sit at the top of the board, always.
          </p>
        </section>

        <hr className={RULE} />

        {/* ── Real Campus Scenarios ───────────────────────────────────── */}
        <section className="scroll-mt-8">
          <span className="font-mono text-[0.8rem] uppercase tracking-widest text-chalky/80">
            [ In The Corridor ]
          </span>
          <h2 className="chalk-write m-0 mt-1 font-display text-[1.9rem] text-chalk sm:text-[2.2rem]">
            Built for 8:00 AM dilemmas
          </h2>
          <p className="mt-2 max-w-[54ch] font-hand text-[1.1rem] text-chalk/70">
            Real Manipal moments where BunkMate saves your attendance register:
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-chalk/25 bg-[#17251d]/40 p-4 transition-colors hover:border-chalky/35">
              <p className="m-0 font-display text-[1.05rem] text-chalky">
                🌧️ The 7:45 AM Manipal Downpour
              </p>
              <p className="m-0 mt-2 font-hand text-[0.95rem] leading-[1.5] text-chalk/65">
                Bed is cozy, rain is lashing against the hostel window. One glance at your board:
                5 bunks left in DS? Pull the blanket back over without anxiety.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-chalk/25 bg-[#17251d]/40 p-4 transition-colors hover:border-chalky/35">
              <p className="m-0 font-display text-[1.05rem] text-chalky">
                🏃 The Proxy Catastrophe
              </p>
              <p className="m-0 mt-2 font-hand text-[0.95rem] leading-[1.5] text-chalk/65">
                Professor suddenly called names instead of circulating the sheet. One tap on your phone in the hallway. Tally is recorded.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-chalk/25 bg-[#17251d]/40 p-4 transition-colors hover:border-chalky/35">
              <p className="m-0 font-display text-[1.05rem] text-chalky">
                🔬 The Sacred 1-Credit Lab
              </p>
              <p className="m-0 mt-2 font-hand text-[0.95rem] leading-[1.5] text-chalk/65">
                Labs carry 1 credit = 3 skips. Missing one lab burns 33% of your entire semester pass. Protect them for when you really need them.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-chalk/25 bg-[#17251d]/40 p-4 transition-colors hover:border-chalky/35">
              <p className="m-0 font-display text-[1.05rem] text-chalky">
                🎪 Revels & TechTatva Marathon
              </p>
              <p className="m-0 mt-2 font-hand text-[0.95rem] leading-[1.5] text-chalk/65">
                Fest rehearsals and organizing duties happen during class hours. Check your buffer weeks ahead so you don't end up on the detention list.
              </p>
            </div>
          </div>
        </section>

        <hr className={RULE} />

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-6 pb-2 max-sm:flex-col max-sm:items-start">
          <div>
            <p className="m-0 font-hand text-[1.15rem] text-chalk/85">
              Counts save on your device. No account, no sign-in, no server.
            </p>
            <p className="m-0 mt-1 font-hand text-[0.92rem] text-chalk/45">
              made by hackathon Badcows · Manipal attendance simplified
            </p>
          </div>
          <button
            type="button"
            className={CTA_CLASS}
            onClick={() => {
              if (soundEnabled) playChalkSound();
              onOpen();
            }}
          >
            Open the board
          </button>
        </footer>
      </section>

      {/* ── The Classroom Chalk Tray ─────────────────────────────────── */}
      <div className="chalk-tray flex items-center justify-between py-2.5" aria-hidden="true">
        <div className="flex items-center gap-4">
          <span
            className="chalk-stick bg-[#e8a9a0]"
            style={{ transform: "rotate(-4deg)" }}
            onClick={() => handleChalkStickClick("chalkpink")}
            title="Pink warning chalk"
          />
          <span
            className="chalk-stick bg-[#efd28a]"
            style={{ transform: "rotate(2deg)" }}
            onClick={() => handleChalkStickClick("chalky")}
            title="Yellow highlight chalk"
          />
          <span
            className="chalk-stick bg-[#ece9dc]"
            style={{ transform: "rotate(-2deg)" }}
            onClick={() => handleChalkStickClick("chalk")}
            title="Classic white chalk"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-hand text-[0.82rem] text-chalk/40 max-sm:hidden">
            Classroom Chalk Tray
          </span>
          <span
            className="eraser"
            onClick={() => {
              if (soundEnabled) playChalkSound();
            }}
            title="Felt chalkboard eraser"
          />
        </div>
      </div>
    </div>
  );
}
