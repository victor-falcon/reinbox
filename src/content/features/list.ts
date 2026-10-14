/*
 * Thread list in the Focus style. Layout, hover actions and the pin live in
 * list.css; this adds what CSS cannot: sender avatars and date headings.
 * Headings are not inserted into Gmail's tbody: the first row of each group
 * gets `data-ri-group` and CSS draws the heading with a pseudo-element.
 */
import { SELECTORS, onDomChange } from "../gmail";
import { AVATAR_CLASS, renderAvatar } from "./list/avatars";
import { dateGroup, locale, parseGmailDate } from "./list/dates";

const GROUP_ATTR = "data-ri-group";
const SUB_ATTR = "data-ri-group-sub";
// Width of the heading label, so the secondary date can sit right after it.
const LABEL_WIDTH = "--ri-group-w";

// Heading label widths by text, measured once the label is rendered.
const labelWidths = new Map<string, string>();

function setAttr(el: Element, name: string, value: string | undefined): void {
  if (value === undefined) el.removeAttribute(name);
  else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

// The secondary date sits right after the label, so the label's rendered
// width is needed. Only labels not measured yet read layout.
function labelWidth(row: HTMLElement, label: string): string | undefined {
  let width = labelWidths.get(label);
  if (!width) {
    width = getComputedStyle(row, "::before").width;
    // "auto" while the row is not rendered (hidden list): retry next time.
    if (!width.endsWith("px")) return undefined;
    labelWidths.set(label, width);
  }
  return width;
}

function groupRows(rows: HTMLElement[], now: Date, lang: string): void {
  let previous: string | undefined;
  for (const row of rows) {
    const title = row.querySelector(SELECTORS.rowDate)?.getAttribute("title");
    const date = title ? parseGmailDate(title, lang) : undefined;
    // An unparsable date stays in the previous group.
    const group = date ? dateGroup(date, now, lang) : undefined;
    const starts = group !== undefined && group.key !== previous;
    if (group) previous = group.key;

    setAttr(row, GROUP_ATTR, starts ? group.label : undefined);
    const width = starts && group.sub ? labelWidth(row, group.label) : undefined;
    setAttr(row, SUB_ATTR, width ? group?.sub : undefined);
    if (!width) row.style.removeProperty(LABEL_WIDTH);
    else if (row.style.getPropertyValue(LABEL_WIDTH) !== width) row.style.setProperty(LABEL_WIDTH, width);
  }
}

function update(): void {
  const now = new Date();
  const lang = locale();
  // Gmail keeps one list per visited view; each tbody is grouped on its own.
  const lists = new Map<Element, HTMLElement[]>();
  for (const row of document.querySelectorAll<HTMLElement>(`${SELECTORS.main} ${SELECTORS.row}`)) {
    renderAvatar(row);
    const tbody = row.parentElement;
    if (!tbody) continue;
    const rows = lists.get(tbody) ?? [];
    rows.push(row);
    lists.set(tbody, rows);
  }
  for (const rows of lists.values()) groupRows(rows, now, lang);
}

export function start(): () => void {
  const onFonts = () => {
    // Plus Jakarta Sans may load after the first measurement.
    labelWidths.clear();
    update();
  };
  document.fonts.addEventListener("loadingdone", onFonts);
  const stop = onDomChange(update);
  update();

  return () => {
    stop();
    document.fonts.removeEventListener("loadingdone", onFonts);
    for (const avatar of document.querySelectorAll(`.${AVATAR_CLASS}`)) avatar.remove();
    for (const row of document.querySelectorAll<HTMLElement>(`[${GROUP_ATTR}], [${SUB_ATTR}]`)) {
      row.removeAttribute(GROUP_ATTR);
      row.removeAttribute(SUB_ATTR);
      row.style.removeProperty(LABEL_WIDTH);
    }
  };
}
