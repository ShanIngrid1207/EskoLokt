// ─── EditableShopName ────────────────────────────────────────────────────────
// Click-to-edit shop name. Shows the current name (defaulting to "Your shop");
// clicking it swaps in a text box. Enter / blur saves, Escape cancels. The value
// lives in the browser via lib/shopName — nothing on-chain. The `className` is
// applied to both the label and the input so each caller keeps its own type size.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useShopName } from "../lib/shopName";

export function EditableShopName({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) {
  const { name, rename } = useShopName(address);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in sync if the stored name changes while not editing.
  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  // Focus + select the text as soon as the input appears.
  useLayoutEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    rename(draft); // blank clears back to the default
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={40}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        placeholder="Your shop"
        aria-label="Shop name"
        className={`w-full min-w-0 rounded border border-primary/50 bg-background px-1 outline-none ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to rename your shop"
      className={`group inline-flex max-w-full items-center gap-1 rounded text-left hover:text-foreground ${className}`}
    >
      <span className="truncate">{name}</span>
      <PencilIcon className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
    </button>
  );
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-3 ${className}`}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
