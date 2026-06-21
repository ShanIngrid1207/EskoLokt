import { useMemo, useState } from "react";
import { ORDERS, STATUS_META, summarize, VOLUME_BUCKETS } from "../data/orders";
import type { Order, OrderStatus } from "../data/orders";
import { MiniBarChart } from "./MiniBarChart";
import { IconSearch, IconChevronDown, IconExternal } from "./icons";

const CONTRACT_URL =
  "https://stellar.expert/explorer/testnet/contract/CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";

type StatusTab = "All" | OrderStatus;
type SortKey = "ts" | "amount" | "settlementMs";
type SortDir = "asc" | "desc";

const TABS: StatusTab[] = ["All", "Funded", "Released", "Refunded"];

const fmtAmount = (n: number) => `${n.toLocaleString("en-US")}`;
const fmtSettle = (ms: number) => (ms === 0 ? "—" : `${(ms / 1000).toFixed(2)}s`);

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
      {/* Status tab strip */}
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
                placeholder="ID or address"
                aria-label="Find order by ID or address"
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
          <div className="cards-row">
            {/* Summary breakdown */}
            <section className="panel summary">
              <div className="summary-total">
                <span className="big">{summary.total}</span>
                <span className="sub">orders · {fmtAmount(summary.volume)} USDC escrowed</span>
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

            {/* Chart */}
            <section className="panel chart">
              <div className="panel-head">
                <span>Orders over time</span>
                <span className="muted-xs">Last 24 hours</span>
              </div>
              <MiniBarChart data={VOLUME_BUCKETS} />
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
                    <th>Buyer → Seller</th>
                    <th className="sortable num" onClick={() => toggleSort("amount")}>
                      Amount <span className="caret">{sortCaret("amount")}</span>
                    </th>
                    <th>Status</th>
                    <th className="sortable num" onClick={() => toggleSort("settlementMs")}>
                      Settlement <span className="caret">{sortCaret("settlementMs")}</span>
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
                        No orders match these filters.
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
        <code>{o.buyer}</code>
        <span className="arrow">→</span>
        <code>{o.seller}</code>
      </td>
      <td className="num mono strong">{fmtAmount(o.amount)} USDC</td>
      <td>
        <span className={`status-badge ${tone}`}>{o.status}</span>
      </td>
      <td className="num mono dim">{fmtSettle(o.settlementMs)}</td>
      <td className="num">
        <a className="view" href={CONTRACT_URL} target="_blank" rel="noreferrer" aria-label={`View ${o.id} on Stellar Expert`}>
          View <IconExternal size={13} />
        </a>
      </td>
    </tr>
  );
}
