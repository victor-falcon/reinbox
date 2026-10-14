import { SELECTORS, onDomChange } from "../gmail";
import { t } from "../i18n";

// Visible label of the thread toolbar's Archive button, restyled as Done.
const DONE_LABEL = "data-ri-done";
// "plain" or "rich", read by conversation.css to pick the body surface.
const BODY_KIND = "data-ri-body";

// Anything that carries the sender's own colors or layout. Such bodies keep a
// light "paper" surface in dark mode; plain ones follow the theme text color.
const RICH_CONTENT = [
  "table",
  "img",
  "style",
  "font[color]",
  "[bgcolor]",
  "[background]",
  "[style*='color' i]",
  "[style*='background' i]",
].join(",");

function labelDoneButtons(): void {
  const label = t("doneButton");
  for (const button of document.querySelectorAll(SELECTORS.threadArchive)) {
    if (button.getAttribute(DONE_LABEL) !== label) button.setAttribute(DONE_LABEL, label);
  }
}

function classifyBodies(): void {
  for (const body of document.querySelectorAll(`${SELECTORS.messageBody}:not([${BODY_KIND}])`)) {
    // Gmail may insert the container before its content: retry on the next change.
    if (!body.firstElementChild && !body.textContent?.trim()) continue;
    body.setAttribute(BODY_KIND, body.querySelector(RICH_CONTENT) ? "rich" : "plain");
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
    for (const el of document.querySelectorAll(`[${DONE_LABEL}]`)) el.removeAttribute(DONE_LABEL);
    for (const el of document.querySelectorAll(`[${BODY_KIND}]`)) el.removeAttribute(BODY_KIND);
  };
}
