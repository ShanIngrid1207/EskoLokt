// ─── Toasts ──────────────────────────────────────────────────────────────────
// Tiny global toast system (no provider needed): call toast.success(...) from
// anywhere; <Toaster/> is mounted once in main.tsx. Supports a "loading" toast
// you can later .update() to success/error — used for on-chain steps.

import { useEffect, useReducer } from "react";

type Kind = "success" | "error" | "info" | "loading";
export type ToastItem = { id: number; kind: Kind; message: string };

let items: ToastItem[] = [];
let listeners: Array<() => void> = [];
let seq = 0;
const emit = () => listeners.forEach((l) => l());
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function schedule(id: number, kind: Kind) {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  const ms = kind === "loading" ? 0 : kind === "error" ? 4500 : 3000;
  if (ms > 0) timers.set(id, setTimeout(() => toast.dismiss(id), ms));
}

export const toast = {
  show(kind: Kind, message: string): number {
    const id = ++seq;
    items = [...items, { id, kind, message }];
    emit();
    schedule(id, kind);
    return id;
  },
  update(id: number, kind: Kind, message: string) {
    if (!items.some((t) => t.id === id)) return toast.show(kind, message);
    items = items.map((t) => (t.id === id ? { ...t, kind, message } : t));
    emit();
    schedule(id, kind);
    return id;
  },
  dismiss(id: number) {
    items = items.filter((t) => t.id !== id);
    const tm = timers.get(id);
    if (tm) clearTimeout(tm);
    timers.delete(id);
    emit();
  },
  success: (m: string) => toast.show("success", m),
  error: (m: string) => toast.show("error", m),
  info: (m: string) => toast.show("info", m),
  loading: (m: string) => toast.show("loading", m),
};

export function Toaster() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.push(force);
    return () => {
      listeners = listeners.filter((l) => l !== force);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-[100] flex flex-col items-end gap-2 sm:left-auto">
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(-12px) scale(0.98)}to{opacity:1;transform:none}}`}</style>
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onClose={() => toast.dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const tone =
    item.kind === "success"
      ? "border-emerald-500/30 bg-emerald-50 text-emerald-800"
      : item.kind === "error"
        ? "border-rose-500/30 bg-rose-50 text-rose-800"
        : "border-border bg-card text-foreground";
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg animate-[toast-in_0.25s_ease-out] ${tone}`}
    >
      <Icon kind={item.kind} />
      <span className="flex-1">{item.message}</span>
      {item.kind !== "loading" && (
        <button onClick={onClose} aria-label="Dismiss" className="opacity-50 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}

// A slim persistent bar shown whenever the device is offline. Self-contained so
// it can mount once (in main.tsx) and work across every screen.
export function OfflineBanner() {
  const [, force] = useReducer((x) => x + 1, 0);
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  useEffect(() => {
    const on = () => force();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[101] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-amber-950">
      <span className="size-1.5 rounded-full bg-amber-950/70" />
      You're offline — the app still works. Anything you send goes through once you're back.
    </div>
  );
}

function Icon({ kind }: { kind: Kind }) {
  if (kind === "loading")
    return (
      <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
    );
  if (kind === "success")
    return (
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 5 5L20 7" />
      </svg>
    );
  if (kind === "error")
    return (
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 8v5M12 16h.01" /><circle cx="12" cy="12" r="9" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 8h.01M11 12h1v5h1" /><circle cx="12" cy="12" r="9" />
    </svg>
  );
}
