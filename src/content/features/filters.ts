import { SELECTORS, onDomChange } from "../gmail";
import { t } from "../i18n";

// Search filters (Gmail's refinement chips) in the Focus "floating" design:
// one "Filters (n)" button, the active filters as chips next to it, and the
// rest of the chips in a menu that the button opens. The chips stay Gmail's
// own, so their dropdowns and toggles keep working.
const ACTIVE_ATTR = "data-ri-active";
const OPEN_CLASS = "ri-filters-open";

// A toggle chip is active when pressed; a dropdown chip ("From", "Any time")
// when its label no longer reads its default.
function isActive(chip: Element): boolean {
  if (chip.getAttribute("aria-pressed") === "true") return true;
  const fallback = chip.getAttribute("data-default-label");
  if (fallback === null) return false;
  const label = chip.querySelector(SELECTORS.filterChipLabel)?.textContent?.trim() ?? "";
  return label !== "" && label !== fallback;
}

function createToggle(bar: Element): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ri-filters-toggle";
  button.setAttribute("aria-expanded", "false");

  const text = document.createElement("span");
  text.textContent = t("filters");
  const count = document.createElement("span");
  count.className = "ri-filters-count";
  button.append(text, count);

  button.addEventListener("click", () => setOpen(bar, !bar.classList.contains(OPEN_CLASS)));
  return button;
}

function setOpen(bar: Element, open: boolean): void {
  bar.classList.toggle(OPEN_CLASS, open);
  bar.querySelector(".ri-filters-toggle")?.setAttribute("aria-expanded", String(open));
}

function update(): void {
  for (const bar of document.querySelectorAll(SELECTORS.filterBar)) {
    let active = 0;
    for (const chip of bar.querySelectorAll(SELECTORS.filterChip)) {
      const on = isActive(chip);
      if (on) active++;
      const holder = chip.parentElement?.matches(SELECTORS.filterChipHolder) ? chip.parentElement : chip;
      if (holder.hasAttribute(ACTIVE_ATTR) !== on) holder.toggleAttribute(ACTIVE_ATTR, on);
    }

    let toggle = bar.querySelector<HTMLButtonElement>(".ri-filters-toggle");
    if (!toggle) {
      toggle = createToggle(bar);
      bar.prepend(toggle);
    }
    const count = toggle.querySelector(".ri-filters-count");
    const value = active ? String(active) : "";
    if (count && count.textContent !== value) count.textContent = value;
  }
}

// Close the menu on Escape or a click outside it. Gmail's own dropdown menus
// (opened from a chip inside ours) live in <body>, so clicks there keep it open.
function onDocumentClick(event: MouseEvent): void {
  const target = event.target as Element | null;
  for (const bar of document.querySelectorAll(`${SELECTORS.filterBar}.${OPEN_CLASS}`)) {
    if (target && (bar.contains(target) || target.closest("[role=menu], [role=dialog]"))) continue;
    setOpen(bar, false);
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  for (const bar of document.querySelectorAll(`${SELECTORS.filterBar}.${OPEN_CLASS}`)) {
    setOpen(bar, false);
    bar.querySelector<HTMLElement>(".ri-filters-toggle")?.focus();
  }
}

export function start(): () => void {
  update();
  const stop = onDomChange(update);
  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("keydown", onKeydown);

  return () => {
    stop();
    document.removeEventListener("click", onDocumentClick, true);
    document.removeEventListener("keydown", onKeydown);
    for (const el of document.querySelectorAll(".ri-filters-toggle")) el.remove();
    for (const el of document.querySelectorAll(`.${OPEN_CLASS}`)) el.classList.remove(OPEN_CLASS);
    for (const el of document.querySelectorAll(`[${ACTIVE_ATTR}]`)) el.removeAttribute(ACTIVE_ATTR);
  };
}
