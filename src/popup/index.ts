import { type MessageKey, language, t } from "../content/i18n";
import { type Prefs, type Theme, loadPrefs, onPrefsChange, savePrefs } from "../content/prefs";

const darkQuery = matchMedia("(prefers-color-scheme: dark)");
const enabledInput = document.querySelector<HTMLInputElement>("#enabled")!;
const themeInputs = [...document.querySelectorAll<HTMLInputElement>("input[name=theme]")];

let prefs: Prefs;
// Writes in flight. Their storage echoes are older than the local state.
let pendingSaves = 0;

function applyTheme(): void {
  const dark = prefs.theme === "dark" || (prefs.theme === "auto" && darkQuery.matches);
  document.documentElement.classList.toggle("ri-dark", dark);
}

function render(next: Prefs): void {
  prefs = next;
  enabledInput.checked = prefs.enabled;
  for (const input of themeInputs) input.checked = input.value === prefs.theme;
  applyTheme();
}

// Open Gmail tabs pick the change up through their own storage listener.
function update(change: Partial<Prefs>): void {
  const previous = prefs;
  render({ ...prefs, ...change });
  pendingSaves++;
  savePrefs(prefs)
    .catch((error) => {
      console.warn("[reinbox] could not save prefs", error);
      // Show what Gmail actually has.
      render(previous);
    })
    .finally(() => pendingSaves--);
}

function translate(): void {
  // popup.html ships without lang, so language() falls back to the browser's.
  document.documentElement.lang = language();
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n as MessageKey);
  }
  document.querySelector("#version")!.textContent = `v${chrome.runtime.getManifest().version}`;
}

async function main(): Promise<void> {
  translate();
  // Follow the OS until the stored theme arrives, to avoid a light flash.
  document.documentElement.classList.toggle("ri-dark", darkQuery.matches);
  render(await loadPrefs());

  enabledInput.addEventListener("change", () => update({ enabled: enabledInput.checked }));
  for (const input of themeInputs) {
    input.addEventListener("change", () => update({ theme: input.value as Theme }));
  }
  darkQuery.addEventListener("change", applyTheme);
  // Keep in sync when prefs change elsewhere (another window, another device).
  onPrefsChange((next) => {
    if (pendingSaves === 0) render(next);
  });
}

main();
