// Keep production requests same-origin by default. Nginx proxies `/v1` to the backend.
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const isRemoteBrowser = !["localhost", "127.0.0.1"].includes(window.location.hostname);
const configuredLocalhost = configuredApiBase?.includes("localhost") || configuredApiBase?.includes("127.0.0.1");

export const API_BASE_URL = import.meta.env.DEV || (isRemoteBrowser && configuredLocalhost)
  ? window.location.origin
  : (configuredApiBase || window.location.origin);

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
