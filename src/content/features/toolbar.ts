import { SELECTORS, onDomChange } from "../gmail";
import { t } from "../i18n";

// The toolbar is Gmail's own: its buttons keep their behavior and menus.
// This feature only tags them so toolbar.css can restyle each state:
//   list idle    → pagination and refresh on the heading line
//   list select  → a floating bar at the bottom with the count and actions
//   thread       → back button, then the actions in a capsule
const STATE_ATTR = "data-ri-toolbar";
const ACTION_ATTR = "data-ri-action";
const LABEL_ATTR = "data-ri-label";
// Gmail's own aria-label of the Archive button, restored on cleanup.
const ARIA_BACKUP_ATTR = "data-ri-aria-label";
const SELECTION_CLASS = "ri-selection";

type Action =
  | "done"
  | "spam"
  | "delete"
  | "unread"
  | "read"
  | "back"
  | "refresh"
  | "move"
  | "labels"
  | "snooze"
  | "tasks"
  | "more"
  | "select"
  | "other";

// Gmail's command ids (`act`) are stable across languages and UI updates.
const BY_ACT: Record<string, Action> = {
  "7": "done",
  "9": "spam",
  "10": "delete",
  "2": "unread",
  "1": "read",
  "19": "back",
  "20": "refresh",
};

// Buttons without an `act`: matched by class first, then by their label in
// the languages Reinbox ships.
const BY_CLASS: Array<[string, Action]> = [
  ["ns", "move"],
  ["mw", "labels"],
  ["nf", "more"],
  ["T-Pm", "select"],
];

const BY_LABEL: Array<[RegExp, Action]> = [
  [/^(snooze|posponer)/i, "snooze"],
  [/^(labels?|etiquetas?|etiquetar)$/i, "labels"],
  [/(tasks|tareas)/i, "tasks"],
  [/^(move to|mover a)$/i, "move"],
];

function labelOf(button: Element): string {
  return (
    button.textContent?.trim() ||
    button.getAttribute("data-tooltip") ||
    button.getAttribute("aria-label") ||
    button.getAttribute("title") ||
    ""
  ).trim();
}

function actionOf(button: Element): Action {
  const act = button.getAttribute("act");
  if (act && BY_ACT[act]) return BY_ACT[act];
  for (const [cls, action] of BY_CLASS) if (button.classList.contains(cls)) return action;
  const label = labelOf(button);
  for (const [pattern, action] of BY_LABEL) if (pattern.test(label)) return action;
  return "other";
}

function setAttr(el: Element, name: string, value: string): void {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function tagButtons(toolbar: Element): void {
  for (const button of toolbar.querySelectorAll(SELECTORS.toolbarButton)) {
    const action = actionOf(button);
    setAttr(button, ACTION_ATTR, action);
    if (action === "done") {
      setAttr(button, LABEL_ATTR, t("doneButton"));
      if (!button.hasAttribute(ARIA_BACKUP_ATTR)) {
        button.setAttribute(ARIA_BACKUP_ATTR, button.getAttribute("aria-label") ?? "");
      }
      setAttr(button, "aria-label", t("markDone"));
    } else {
      const label = labelOf(button);
      if (label) setAttr(button, LABEL_ATTR, label);
    }
  }
}

function selectedCount(): number {
  return document.querySelectorAll(SELECTORS.selectedRow).length;
}

// "× 3 selected" at the start of the floating bar. Clearing clicks Gmail's
// master checkbox, which unselects everything when some rows are selected.
function ensureSelectionLabel(toolbar: Element, count: number): void {
  const group = toolbar.querySelector(SELECTORS.toolbarActions);
  if (!group) return;
  let label = group.querySelector<HTMLElement>(".ri-selection-label");
  if (!label) {
    label = document.createElement("div");
    label.className = "ri-selection-label";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "ri-selection-clear";
    clear.setAttribute("aria-label", t("clearSelection"));
    clear.addEventListener("click", () => {
      const master = toolbar.querySelector(SELECTORS.toolbarCheckbox);
      for (const type of ["mousedown", "mouseup", "click"]) {
        master?.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      }
    });

    const text = document.createElement("span");
    text.className = "ri-selection-count";
    label.append(clear, text);
    group.prepend(label);
  }
  const text = label.querySelector(".ri-selection-count");
  const value = t("selectedCount").replace("{n}", String(count));
  if (text && text.textContent !== value) text.textContent = value;
}

function update(): void {
  const count = selectedCount();
  document.documentElement.classList.toggle(SELECTION_CLASS, count > 0);

  for (const toolbar of document.querySelectorAll(SELECTORS.toolbar)) {
    const thread = toolbar.querySelector(SELECTORS.threadBack) !== null;
    const state = thread ? "thread" : count > 0 ? "select" : "list";
    setAttr(toolbar, STATE_ATTR, state);
    tagButtons(toolbar);
    if (state === "select") ensureSelectionLabel(toolbar, count);
    else toolbar.querySelector(".ri-selection-label")?.remove();
  }
}

function restore(): void {
  document.documentElement.classList.remove(SELECTION_CLASS);
  for (const el of document.querySelectorAll(".ri-selection-label")) el.remove();
  for (const el of document.querySelectorAll(`[${STATE_ATTR}]`)) el.removeAttribute(STATE_ATTR);
  for (const el of document.querySelectorAll(`[${ACTION_ATTR}]`)) {
    el.removeAttribute(ACTION_ATTR);
    el.removeAttribute(LABEL_ATTR);
    const original = el.getAttribute(ARIA_BACKUP_ATTR);
    if (original === null) continue;
    if (original) el.setAttribute("aria-label", original);
    else el.removeAttribute("aria-label");
    el.removeAttribute(ARIA_BACKUP_ATTR);
  }
}

export function start(): () => void {
  update();
  const stop = onDomChange(update);
  return () => {
    stop();
    restore();
  };
}
