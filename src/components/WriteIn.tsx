interface Props {
  steps: string[];
}

/* The one orchestrated entrance: setup lines write themselves in, staggered. */
export default function WriteIn({ steps }: Props) {
  return (
    <ol className="m-0 list-none space-y-3 p-0 font-hand text-lg text-chalk/80">
      {steps.map((step, i) => (
        <li
          key={step}
          className="flex items-baseline gap-3 chalk-write"
          style={i > 0 ? { animationDelay: `${i * 0.25}s` } : undefined}
        >
          <span className="font-display text-[0.95rem] text-chalky">{i + 1}.</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
