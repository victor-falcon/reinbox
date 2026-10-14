import { SELECTORS, onDomChange } from "../gmail";

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

export function start(): () => void {
  classifyBodies();
  const stop = onDomChange(classifyBodies);

  return () => {
    stop();
    for (const el of document.querySelectorAll(`[${BODY_ATTR}]`)) el.removeAttribute(BODY_ATTR);
  };
}
