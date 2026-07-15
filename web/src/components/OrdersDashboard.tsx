import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { ORDERS, STATUS_META, summarize, VOLUME_BUCKETS, CHANNEL_SERIES } from "../data/orders";
import type { Order, OrderStatus } from "../data/orders";
import { MiniBarChart } from "./MiniBarChart";
import { IconSearch, IconChevronDown, IconExternal } from "./icons";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Step-line chart: cumulative orders per channel ───────────────────────────
// Pure SVG, no library. Each series draws a step-path (H then V segments)
// with a draw-in animation + hover tooltip showing all values at cursor.
function StepLineChart({
  series,
  labels,
}: {
  series: { name: string; color: string; steps: number[] }[];
  labels: string[];
}) {
  const W = 400;
  const H = 180;
  const padL = 26;
  const padB = 26;
  const padT = 14;
  const padR = 10;
  const maxVal = Math.max(1, ...series.flatMap((s) => s.steps));
  const innerW = W - padL - padR;
  const innerH = H - padB - padT;
  const xAt = useCallback(
    (i: number) => padL + (i / (labels.length - 1)) * innerW,
    [labels.length, innerW],
  );
  const yAt = useCallback(
    (v: number) => padT + innerH - (v / maxVal) * innerH,
    [maxVal, innerH],
  );

  const buildStepPath = useCallback(
    (steps: number[]) => {
      if (steps.length === 0) return "";
      let d = `M ${xAt(0)} ${yAt(steps[0])}`;
      for (let i = 1; i < steps.length; i++) {
        d += ` H ${xAt(i)} V ${yAt(steps[i])}`;
      }
      return d;
    },
    [xAt, yAt],
  );

  const ticks = [0, Math.round(maxVal / 2), maxVal].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );

  // Path length measurement for draw animation
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [pathLengths, setPathLengths] = useState<number[]>([]);

  useEffect(() => {
    const lengths = pathRefs.current.map((el) =>
      el ? el.getTotalLength() : 1000,
    );
    setPathLengths(lengths);
  }, [series]);

  // Hover state
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const svgX = (e.clientX - rect.left) * scaleX;
    // Find nearest label index
    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < labels.length; i++) {
      const dist = Math.abs(svgX - xAt(i));
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Channel sales over time"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* y gridlines */}
        {ticks.map((t) => {
          const y = yAt(t);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="grid-line" />
              <text x={padL - 6} y={y + 4} className="axis-label" textAnchor="end">
                {t}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {labels.map((label, i) => (
          <text
            key={label}
            x={xAt(i)}
            y={H - 6}
            className="axis-label"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* Vertical hover line */}
        {hoverIdx !== null && (
          <line
            x1={xAt(hoverIdx)}
            y1={padT}
            x2={xAt(hoverIdx)}
            y2={padT + innerH}
            stroke="var(--border-strong)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* step-line per series with draw animation */}
        {series.map((s, idx) => {
          const len = pathLengths[idx] ?? 1000;
          return (
            <path
              key={s.name}
              ref={(el) => { pathRefs.current[idx] = el; }}
              d={buildStepPath(s.steps)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="step-path"
              style={{
                ["--path-length" as string]: len,
                ["--line-delay" as string]: `${idx * 0.15}s`,
                strokeDasharray: len,
                strokeDashoffset: len,
              } as React.CSSProperties}
            />
          );
        })}

        {/* Hover dots at intersection */}
        {hoverIdx !== null &&
          series.map((s) => (
            <circle
              key={s.name + "-hover"}
              cx={xAt(hoverIdx)}
              cy={yAt(s.steps[hoverIdx])}
              r={4}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}

        {/* Endpoint dots (always visible) */}
        {series.map((s) => {
          const last = s.steps.length - 1;
          return (
            <circle
              key={s.name + "-dot"}
              cx={xAt(last)}
              cy={yAt(s.steps[last])}
              r={3.5}
              fill={s.color}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (
        <div
          style={{
            position: "absolute",
            left: tooltipPos.x,
            top: tooltipPos.y - 16,
            transform: "translate(-50%, -100%)",
            background: "var(--text)",
            color: "var(--bg)",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            fontWeight: 600,
            padding: "7px 11px",
            borderRadius: "7px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "var(--shadow-md)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: "3px",
          }}
        >
          <div style={{ marginBottom: 2, opacity: 0.7 }}>{labels[hoverIdx]}</div>
          {series.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span>{s.name}: {s.steps[hoverIdx]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CONTRACT_URL =
  "https://stellar.expert/explorer/testnet/contract/CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";

type StatusTab = "All" | OrderStatus;
type SortKey = "ts" | "amount" | "settlementMs";
type SortDir = "asc" | "desc";

const TABS: StatusTab[] = ["All", "Held", "Paid", "Refunded"];

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;
const fmtSettle = (ms: number) => (ms === 0 ? "—" : `${(ms / 1000).toFixed(2)}s`);
function getDeltaIcon(tone: "up" | "down" | "neutral") {
  if (tone === "up") return TrendingUp;
  if (tone === "down") return TrendingDown;
  return Minus;
}

// Derive KPI stats from the full ORDERS array (all-time view for the header cards).
const ALL_SUMMARY = summarize(ORDERS);
const KPI_CARDS = [
  {
    label: "Total orders",
    value: String(ALL_SUMMARY.total),
    delta: "+3.1% vs last week",
    tone: "up" as const,
  },
  {
    label: "Volume",
    value: peso(ALL_SUMMARY.volume),
    delta: "+12.4% vs last week",
    tone: "up" as const,
  },
  {
    label: "Held (escrow active)",
    value: String(ALL_SUMMARY.rows.find((r) => r.status === "Held")?.count ?? 0),
    delta: "awaiting delivery",
    tone: "neutral" as const,
  },
  {
    label: "Paid out",
    value: String(ALL_SUMMARY.rows.find((r) => r.status === "Paid")?.count ?? 0),
    delta: "+8.7% vs last week",
    tone: "up" as const,
  },
];

export function OrdersDashboard() {
  const [tab, setTab] = useState<StatusTab>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "ts", dir: "desc" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = ORDERS.filter((o) => (tab === "All" ? true : o.status === tab));
    if (q) {
      rows = rows.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.buyer.toLowerCase().includes(q) ||
          o.seller.toLowerCase().includes(q),
      );
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => (a[sort.key] - b[sort.key]) * dir);
  }, [tab, query, sort]);

  const summary = useMemo(() => summarize(filtered), [filtered]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  const sortCaret = (key: SortKey) => (sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : "");

  return (
    <div className="orders">
      {/* ── KPI stat cards (Efferd-style) ──────────────────────────────── */}
      <div className="kpi-grid">
        {KPI_CARDS.map((kpi) => {
          const DeltaIcon = getDeltaIcon(kpi.tone);
          return (
            <div className="kpi-card" key={kpi.label}>
              <p className="kpi-label">{kpi.label}</p>
              <p className="kpi-value">{kpi.value}</p>
              <span className={`kpi-delta ${kpi.tone}`}>
                <DeltaIcon size={12} />
                {kpi.delta}
              </span>
            </div>
          );
        })}
      </div>

      <div className="tabstrip" role="tablist">
        {TABS.map((t) => {
          const count = t === "All" ? ORDERS.length : ORDERS.filter((o) => o.status === t).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="dash-grid">
        {/* Filters column */}
        <aside className="filters">
          <span className="filters-title">Filters</span>

          <label className="field">
            <span>Timeframe</span>
            <div className="select">
              Last 24 hours <IconChevronDown size={15} />
            </div>
          </label>

          <label className="field">
            <span>Find order</span>
            <div className="search">
              <IconSearch size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Customer name or order #"
                aria-label="Find order by customer name or order number"
              />
            </div>
          </label>

          <div className="field">
            <span>Sort by</span>
            <div className="sortbtns">
              {(
                [
                  ["ts", "Newest"],
                  ["amount", "Amount"],
                  ["settlementMs", "Settlement"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={`chip ${sort.key === key ? "on" : ""}`}
                  onClick={() => toggleSort(key)}
                >
                  {label} {sortCaret(key)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="dash-main">
          <div className="cards-row-3">
            {/* Summary breakdown */}
            <section className="panel summary">
              <div className="summary-total">
                <span className="big">{summary.total}</span>
                <span className="sub">orders · {peso(summary.volume)} paid on delivery</span>
              </div>
              <div className="breakdown-head">
                <span>STATUS</span>
                <span>ORDERS</span>
              </div>
              <ul className="breakdown">
                {summary.rows.map((r) => (
                  <li key={r.status}>
                    <span className="bd-label">
                      <span className="bd-dot" style={{ background: STATUS_META[r.status].dot }} />
                      {r.status}
                    </span>
                    <span className="bd-val">
                      <strong>{r.count}</strong>
                      <span className="bd-pct">{r.pct}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Net Revenue bar chart */}
            <section className="panel chart">
              <div className="panel-head">
                <span>Net revenue</span>
                <span className="chart-delta-badge">↗ 12.4%</span>
              </div>
              <div className="chart-panel-subtitle">Daily orders, last 24 hours.</div>
              <MiniBarChart data={VOLUME_BUCKETS} />
            </section>

            {/* Channel Sales step-line chart */}
            <section className="panel chart">
              <div className="panel-head">
                <span>Channel sales</span>
                <span className="chart-delta-badge">↗ 58.3%</span>
              </div>
              <div className="chart-panel-subtitle">Orders by shop, last 24 hours.</div>
              <StepLineChart
                series={CHANNEL_SERIES}
                labels={VOLUME_BUCKETS.map((b) => b.label)}
              />
              <div className="chart-legend">
                {CHANNEL_SERIES.map((s) => (
                  <div key={s.name} className="chart-legend-item">
                    <div
                      className="chart-legend-dot"
                      style={{ background: s.color }}
                    />
                    {s.name}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Table */}
          <section className="panel table-panel">
            <div className="table-scroll">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggleSort("ts")}>
                      Created <span className="caret">{sortCaret("ts")}</span>
                    </th>
                    <th>Order</th>
                    <th>Customer → Shop</th>
                    <th className="sortable num" onClick={() => toggleSort("amount")}>
                      Amount <span className="caret">{sortCaret("amount")}</span>
                    </th>
                    <th>Status</th>
                    <th className="sortable num" onClick={() => toggleSort("settlementMs")}>
                      Paid in <span className="caret">{sortCaret("settlementMs")}</span>
                    </th>
                    <th aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <OrderRow key={o.id} o={o} />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty">
                        No orders match what you're looking for.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ o }: { o: Order }) {
  const tone = STATUS_META[o.status].tone;
  return (
    <tr>
      <td className="mono dim">{o.created}</td>
      <td className="mono">{o.id}</td>
      <td className="parties">
        <span className="party">{o.buyer}</span>
        <span className="arrow">→</span>
        <span className="party">{o.seller}</span>
      </td>
      <td className="num mono strong">{peso(o.amount)}</td>
      <td>
        <span className={`status-badge ${tone}`}>{o.status}</span>
      </td>
      <td className="num mono dim">{fmtSettle(o.settlementMs)}</td>
      <td className="num">
        <a className="view" href={CONTRACT_URL} target="_blank" rel="noreferrer" aria-label={`See order ${o.id} receipt on Stellar`}>
          Receipt <IconExternal size={13} />
        </a>
      </td>
    </tr>
  );
}
