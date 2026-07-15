import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn(
    "Supabase env vars missing — the order book is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.",
  );
}

// Fall back to a placeholder so createClient never throws at import time (which
// would blank-screen the whole app). Real order-book calls simply fail until the
// env vars are provided.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key",
);
