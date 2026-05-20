// In dev we proxy `/v1` via Vite to avoid CORS issues (see `vite.config.ts`).
export const API_BASE_URL = import.meta.env.DEV ? window.location.origin : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000");

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}
