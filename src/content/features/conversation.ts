import { SELECTORS, onDomChange } from "../gmail";
import { t } from "../i18n";

// Set on the thread toolbar's Archive button, restyled as Done. Its value is
// the visible label.
const DONE_ATTR = "data-ri-done";
// Gmail's own aria-label of that button, restored on cleanup.
const ARIA_BACKUP_ATTR = "data-ri-aria-label";
// "plain" or "rich" on each email body, read by conversation.css.
const BODY_ATTR = "data-ri-body";

type BodyKind = "plain" | "rich";

// Sender-chosen colors. Bodies with any keep a light "paper" surface in dark
// mode, since recoloring them breaks contrast; the rest follow the theme.
// Images and tables alone stay readable on a dark card, so they don't count.
const RICH_CONTENT = [
  "style",
  "font[color]",
  "[bgcolor]",
  "[background]",
  "[style*='color' i]",
  "[style*='background' i]",
].join(",");
// Gmail's own UI inside a body (the trimmed-content toggle).
const GMAIL_UI_IN_BODY = ".ajR";

// Element count each body had when classified, to re-check it when it grows.
const classified = new WeakMap<Element, number>();

function labelDoneButton(archive: Element): void {
  const label = t("doneButton");
  if (archive.getAttribute(DONE_ATTR) !== label) archive.setAttribute(DONE_ATTR, label);
  const ariaLabel = t("markDone");
  if (archive.getAttribute("aria-label") !== ariaLabel) {
    if (!archive.hasAttribute(ARIA_BACKUP_ATTR)) {
      archive.setAttribute(ARIA_BACKUP_ATTR, archive.getAttribute("aria-label") ?? "");
    }
    archive.setAttribute("aria-label", ariaLabel);
  }
}

// Only thread toolbars have a Back button; the list toolbar's Archive stays.
function labelDoneButtons(): void {
  for (const back of document.querySelectorAll(SELECTORS.threadBack)) {
    const archive = back.closest(SELECTORS.threadToolbar)?.querySelector(SELECTORS.threadArchive);
    if (archive) labelDoneButton(archive);
  }
}

function bodyKind(body: Element): BodyKind {
  for (const el of body.querySelectorAll(RICH_CONTENT)) {
    if (!el.closest(GMAIL_UI_IN_BODY)) return "rich";
  }
  return "plain";
}

function classifyBodies(): void {
  for (const body of document.querySelectorAll(SELECTORS.messageBody)) {
    // Gmail may insert the container before its content: wait for it.
    if (!body.firstElementChild && !body.textContent?.trim()) continue;
    const size = body.getElementsByTagName("*").length;
    if (classified.get(body) === size && body.hasAttribute(BODY_ATTR)) continue;
    classified.set(body, size);
    const kind = bodyKind(body);
    if (body.getAttribute(BODY_ATTR) !== kind) body.setAttribute(BODY_ATTR, kind);
  }
}

function restoreDoneButtons(): void {
  for (const el of document.querySelectorAll(`[${DONE_ATTR}]`)) {
    el.removeAttribute(DONE_ATTR);
    const original = el.getAttribute(ARIA_BACKUP_ATTR);
    if (original === null) continue;
    if (original) el.setAttribute("aria-label", original);
    else el.removeAttribute("aria-label");
    el.removeAttribute(ARIA_BACKUP_ATTR);
  }
}

export function start(): () => void {
  const update = () => {
    labelDoneButtons();
    classifyBodies();
  };
  update();
  const stop = onDomChange(update);

  return () => {
    stop();
    restoreDoneButtons();
    for (const el of document.querySelectorAll(`[${BODY_ATTR}]`)) el.removeAttribute(BODY_ATTR);
  };
}
