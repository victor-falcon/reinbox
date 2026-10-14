export type Theme = "auto" | "light" | "dark";

export interface Prefs {
  enabled: boolean;
  theme: Theme;
}

export const DEFAULT_PREFS: Prefs = {
  enabled: true,
  theme: "auto",
};

const STORAGE_KEY = "prefs";
const THEMES: readonly Theme[] = ["auto", "light", "dark"];

declare global {
  interface Window {
    // Dev harness only: read when chrome.storage is unavailable (page world).
    __REINBOX_PREFS__?: Partial<Prefs>;
  }
}

// Storage may hold partial or stale values, so every field is validated.
export function normalize(value: unknown): Prefs {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<Prefs>;
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_PREFS.enabled,
    theme: THEMES.includes(raw.theme as Theme) ? (raw.theme as Theme) : DEFAULT_PREFS.theme,
  };
}

function storage(): chrome.storage.SyncStorageArea | undefined {
  return typeof chrome !== "undefined" ? chrome.storage?.sync : undefined;
}

export async function loadPrefs(): Promise<Prefs> {
  const sync = storage();
  if (!sync) return normalize(window.__REINBOX_PREFS__);
  const stored = await sync.get(STORAGE_KEY);
  return normalize(stored[STORAGE_KEY]);
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await storage()?.set({ [STORAGE_KEY]: normalize(prefs) });
}

// Returns an unsubscribe function. A no-op without chrome.storage.
export function onPrefsChange(callback: (prefs: Prefs) => void): () => void {
  if (!storage()) return () => {};
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "sync" && changes[STORAGE_KEY]) callback(normalize(changes[STORAGE_KEY].newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
