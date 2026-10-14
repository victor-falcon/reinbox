import { type PrefKey, type Prefs, loadPrefs, onPrefsChange, prefClassName } from "./prefs";

const ROOT_CLASS = "reinbox";

function applyPrefs(prefs: Prefs): void {
  const root = document.documentElement;
  root.classList.toggle(ROOT_CLASS, prefs.enabled);

  for (const key of Object.keys(prefs) as PrefKey[]) {
    if (key === "enabled") continue;
    root.classList.toggle(prefClassName(key), Boolean(prefs[key]));
  }
}

async function main(): Promise<void> {
  applyPrefs(await loadPrefs());
  onPrefsChange(applyPrefs);
}

main();
