import type { Subject } from "../lib/types";

interface Props {
  subject: Pick<Subject, "name" | "credits">;
  used: number;
}

/* Tally strokes: chalk groups of five, the fifth stroke slashes across. */
export default function TallyStrokes({ subject, used }: Props) {
  const GROUP = 30;
  const max = subject.credits * 3;
  const groups = Math.ceil(max / 5) || 1;
  const w = groups * GROUP;
  const color = used >= max && max > 0 ? "var(--color-chalkpink)" : "var(--color-chalky)";

  let strokes = "";
  for (let i = 0; i < used; i++) {
    const g = Math.floor(i / 5);
    const p = i % 5;
    const gx = g * GROUP;
    if (p < 4) {
      const x = gx + 5 + p * 6;
      strokes += `<line x1="${x}" y1="4" x2="${x}" y2="26" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
    } else {
      strokes += `<line x1="${gx + 2}" y1="25" x2="${gx + 24}" y2="5" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
  }

  return (
    <span className="flex w-[150px] min-w-[150px] flex-none items-center" aria-hidden="true">
      <svg
        viewBox={`0 0 ${w} 30`}
        role="img"
        className="h-8 w-auto shrink-0"
        style={strokes ? { filter: "url(#chalkify)" } : undefined}
      >
        {strokes ? <g dangerouslySetInnerHTML={{ __html: strokes }} /> : null}
      </svg>
    </span>
  );
}
