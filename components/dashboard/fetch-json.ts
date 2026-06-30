"use client";

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
      message?: string;
    } | null;
    throw new Error(payload?.detail ?? payload?.message ?? "Request failed");
  }
  return response.json() as Promise<T>;
}
