// Lightweight inline-SVG bar chart — no charting library, so it stays crisp,
// themeable, and bundle-cheap. Renders gridlines, bars, and sparse axis labels.

interface Bucket {
  label: string;
  count: number;
}

export function MiniBarChart({ data }: { data: Bucket[] }) {
  const W = 460;
  const H = 200;
  const padL = 26;
  const padB = 26;
  const padT = 10;
  const max = Math.max(4, ...data.map((d) => d.count));
  const innerW = W - padL;
  const innerH = H - padB - padT;
  const band = innerW / data.length;
  const barW = Math.min(26, band * 0.5);

  const ticks = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Orders over time">
      {/* y gridlines + labels */}
      {ticks.map((t) => {
        const y = padT + innerH - (t / max) * innerH;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W} y2={y} className="grid-line" />
            <text x={padL - 8} y={y + 3} className="axis-label" textAnchor="end">
              {t}
            </text>
          </g>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const h = (d.count / max) * innerH;
        const x = padL + i * band + (band - barW) / 2;
        const y = padT + innerH - h;
        const isLast = i === data.length - 1;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 1)}
              rx={3}
              className={isLast ? "bar bar-active" : "bar"}
            />
            <text x={x + barW / 2} y={H - 8} className="axis-label" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
