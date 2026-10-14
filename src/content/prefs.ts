// Every boolean preference maps to a `ri-<kebab-key>` class on <html>.
// CSS reacts to those classes, so most features need no JavaScript at all.
export const DEFAULT_PREFS = {
  enabled: true,
};

export type Prefs = typeof DEFAULT_PREFS;
export type PrefKey = keyof Prefs;

const STORAGE_KEY = "prefs";

export async function loadPrefs(): Promise<Prefs> {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULT_PREFS, ...(stored[STORAGE_KEY] ?? {}) };
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: prefs });
}

export function onPrefsChange(callback: (prefs: Prefs) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      callback({ ...DEFAULT_PREFS, ...changes[STORAGE_KEY].newValue });
    }
  });
}

export function prefClassName(key: PrefKey): string {
  return `ri-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
