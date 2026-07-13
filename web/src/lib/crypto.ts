// SHA-256 of a delivery code → hex. Used at create time (store the hash) and at
// verify time (compare). Same normalization must be applied by both callers.
export async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  // Copy into a plain ArrayBuffer so the type satisfies BufferSource cleanly.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
