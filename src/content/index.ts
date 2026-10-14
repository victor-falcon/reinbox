import * as conversation from "./features/conversation";
import * as list from "./features/list";
import * as shell from "./features/shell";
import { type Prefs, loadPrefs, normalize, onPrefsChange } from "./prefs";

const ROOT_CLASS = "reinbox";
const DARK_CLASS = "ri-dark";
// Last applied prefs, cached in Gmail's localStorage so the next page load can
// apply them synchronously at document_start instead of after an async read.
const CACHE_KEY = "reinbox:prefs";

const FEATURES = [shell, list, conversation];

const darkQuery = matchMedia("(prefers-color-scheme: dark)");
let prefs: Prefs | undefined;
let stops: Array<() => void> = [];

function isDark(p: Prefs): boolean {
  return p.theme === "dark" || (p.theme === "auto" && darkQuery.matches);
}

function applyClasses(): void {
  if (!prefs) return;
  const root = document.documentElement;
  root.classList.toggle(ROOT_CLASS, prefs.enabled);
  root.classList.toggle(DARK_CLASS, prefs.enabled && isDark(prefs));
}

function apply(next: Prefs): void {
  prefs = next;
  applyClasses();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: only costs a possible flash on the next load.
  }

  if (next.enabled && stops.length === 0) {
    stops = FEATURES.map((feature) => feature.start());
  } else if (!next.enabled) {
    for (const stop of stops) stop();
    stops = [];
  }
}

function cachedPrefs(): Prefs | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalize(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

function main(): void {
  // Classes only from the cache: features wait for the real prefs.
  prefs = cachedPrefs();
  applyClasses();

  darkQuery.addEventListener("change", applyClasses);
  // Gmail may rewrite <html class>; put ours back if it does.
  new MutationObserver(applyClasses).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  loadPrefs().then(apply);
  onPrefsChange(apply);
}

main();
