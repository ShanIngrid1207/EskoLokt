// Lightweight inline-SVG bar chart — no charting library, so it stays crisp,
// themeable, and bundle-cheap. Renders gridlines, bars, and sparse axis labels.
// Bars grow upward with staggered animation and show tooltips on hover.

import { useState, useRef } from "react";

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

  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const handleBarMouse = (
    e: React.MouseEvent,
    d: Bucket,
  ) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTooltip({
      x: mouseX,
      y: mouseY - 12,
      text: `${d.label}: ${d.count} orders`,
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Orders over time"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8d5e9" />
            <stop offset="100%" stopColor="#dfe6f0" />
          </linearGradient>
          <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d84ff" />
            <stop offset="100%" stopColor="#2f6bff" />
          </linearGradient>
        </defs>

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

        {/* bars with staggered grow animation */}
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
                style={{
                  transformOrigin: `${x + barW / 2}px ${padT + innerH}px`,
                  animationDelay: `${i * 0.08}s`,
                }}
                onMouseMove={(e) => handleBarMouse(e, d)}
                onMouseLeave={() => setTooltip(null)}
              />
              <text x={x + barW / 2} y={H - 8} className="axis-label" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "var(--text)",
            color: "var(--bg)",
            fontFamily: "var(--mono)",
            fontSize: "11.5px",
            fontWeight: 600,
            padding: "5px 10px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "var(--shadow-md)",
            zIndex: 50,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
