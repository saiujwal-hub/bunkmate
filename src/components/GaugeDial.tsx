import { useEffect, useRef, useState } from "react";

interface Props {
  /** The value from 0 to 100 for the needle. */
  percent: number;
  big: string;
  small: string;
  /** Cutoff marker on the dial (e.g. 75 for 75% attendance cutoff, or 25 for allowance). */
  threshold?: number;
}

const RANGE: [number, number] = [0, 100];

function gaugePoint(value: number, radius: number) {
  const v = Math.min(Math.max(value, RANGE[0]), RANGE[1]);
  const deg = ((v - 50) * 1.8 * Math.PI) / 180;
  return { x: 100 + radius * Math.sin(deg), y: 110 - radius * Math.cos(deg) };
}

function buildTicks(threshold: number = 75) {
  let markup = `<path d="M 14 110 A 86 86 0 0 1 186 110" fill="none" stroke="rgba(236,233,220,0.3)" stroke-width="2"/>`;
  for (let v = 0; v <= 100; v += 10) {
    const o = gaugePoint(v, 78);
    const i = gaugePoint(v, 70);
    markup += `<line x1="${o.x.toFixed(2)}" y1="${o.y.toFixed(2)}" x2="${i.x.toFixed(2)}" y2="${i.y.toFixed(2)}" stroke="rgba(236,233,220,0.4)" stroke-width="1.6"/>`;
  }
  /* Pink marker at cutoff threshold (75% attendance threshold or 25% allowance). */
  const ft = gaugePoint(threshold, 84);
  const fb = gaugePoint(threshold, 64);
  markup += `<line x1="${ft.x.toFixed(2)}" y1="${ft.y.toFixed(2)}" x2="${fb.x.toFixed(2)}" y2="${fb.y.toFixed(2)}" stroke="var(--color-chalkpink)" stroke-width="2.5"/>`;
  return markup;
}

/* Load moment: the needle starts parked low, then swings up. */
export default function GaugeDial({ percent, big, small, threshold = 75 }: Props) {
  const [armed, setArmed] = useState(false);
  const needle = useRef<SVGLineElement>(null);

  useEffect(() => {
    setArmed(false);
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => setArmed(true)),
    );
    return () => cancelAnimationFrame(t);
  }, []);

  const angle = ((Math.min(Math.max(percent, RANGE[0]), RANGE[1]) - 50) * 1.8).toFixed(2);

  return (
    <figure className="w-[205px] max-sm:mx-auto max-sm:w-[160px] text-center" aria-hidden="true" style={{ margin: 0 }}>
      <svg viewBox="0 0 200 124" className="w-full block">
        <g dangerouslySetInnerHTML={{ __html: buildTicks(threshold) }} />
        <line
          ref={needle}
          x1={100}
          y1={110}
          x2={100}
          y2={50}
          className="dial__needle"
          style={{
            transform: armed ? `rotate(${angle}deg)` : "rotate(-90deg)",
            transformOrigin: "100px 110px",
            transition: "transform 0.9s cubic-bezier(0.34, 1.3, 0.35, 1)",
            stroke: "var(--color-chalk)",
            strokeWidth: 3,
            strokeLinecap: "round",
          }}
        />
        <circle cx={100} cy={110} r={5} fill="var(--color-board-deep)" stroke="var(--color-chalk)" strokeWidth={1.6} />
      </svg>
      <figcaption className="mt-1.5 font-display text-[1.3rem] text-chalk">
        {big}
        <span className="mt-0.5 block font-hand text-[0.82rem] text-chalk/55">{small}</span>
      </figcaption>
    </figure>
  );
}
