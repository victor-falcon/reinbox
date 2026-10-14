import { SELECTORS, onDomChange } from "../../gmail";
import { type MessageKey, t } from "../../i18n";

// Marks the parts of Gmail's header that shell.css lays out, so the CSS does
// not depend on the header's obfuscated class names.
const PART = "data-ri-shell";

const VIEWS: ReadonlyArray<{ key: MessageKey; hash: string }> = [
  { key: "inbox", hash: "#inbox" },
  { key: "snoozed", hash: "#snoozed" },
  // `in:archive` is a documented Gmail operator ("Search for archived messages").
  { key: "done", hash: "#search/in%3Aarchive" },
  { key: "sent", hash: "#sent" },
];

function decodeHash(hash: string): string {
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

// A view stays active while one of its conversations is open (`#inbox/<id>`)
// or while Gmail adds a query to it (`#inbox?compose=new`).
function isActive(viewHash: string): boolean {
  const current = decodeHash(location.hash || "#inbox").split("?")[0];
  const target = decodeHash(viewHash);
  return current === target || current.startsWith(`${target}/`);
}

function buildViews(): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "ri-views";
  nav.setAttribute("aria-label", t("views"));
  for (const view of VIEWS) {
    const link = document.createElement("a");
    link.textContent = t(view.key);
    link.dataset.hash = view.hash;
    // Only the hash changes, so Gmail's account path (/mail/u/N/) is kept.
    link.href = location.href.split("#")[0] + view.hash;
    // Gmail pages carry a <base href>; setting the hash directly guarantees an
    // in-page navigation whatever it points to.
    link.addEventListener("click", (event) => {
      // Modified clicks keep the browser default (new tab, new window).
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      location.hash = view.hash;
    });
    nav.append(link);
  }
  return nav;
}

function updateActive(nav: HTMLElement): void {
  for (const link of nav.querySelectorAll<HTMLAnchorElement>("a")) {
    if (isActive(link.dataset.hash ?? "")) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

// The direct child of `parent` that contains `el`.
function childContaining(parent: Element, el: Element): Element | null {
  let node: Element | null = el;
  while (node && node.parentElement !== parent) node = node.parentElement;
  return node;
}

export function start(): () => void {
  const nav = buildViews();
  // One element per part: Gmail may re-render the header.
  const tagged = new Map<string, Element>();
  let bar: HTMLElement | undefined;

  // The layout keeps the search box clear of the centered views control,
  // whose width depends on the UI language.
  const syncWidth = () => bar?.style.setProperty("--ri-views-w", `${nav.offsetWidth}px`);
  const resize = new ResizeObserver(syncWidth);

  function tag(el: Element | null | undefined, part: string): void {
    const previous = tagged.get(part);
    if (!el || previous === el) return;
    previous?.removeAttribute(PART);
    el.setAttribute(PART, part);
    tagged.set(part, el);
  }

  function mount(): void {
    const menu = document.querySelector(SELECTORS.menuButton);
    const form = document.querySelector(SELECTORS.search);
    const left = menu?.parentElement;
    const nextBar = left?.parentElement;
    if (!form || !left || !nextBar || !nextBar.contains(form)) return;

    bar = nextBar;
    tag(bar, "bar");
    tag(left, "left");
    tag(childContaining(bar, form), "middle");
    tag(form.parentElement, "search");
    if (nav.parentElement !== bar) {
      bar.append(nav);
      resize.observe(nav);
      syncWidth();
    }
  }

  const onHashChange = () => updateActive(nav);
  updateActive(nav);
  mount();
  const stopObserving = onDomChange(mount);
  window.addEventListener("hashchange", onHashChange);

  return () => {
    stopObserving();
    window.removeEventListener("hashchange", onHashChange);
    resize.disconnect();
    nav.remove();
    bar?.style.removeProperty("--ri-views-w");
    for (const el of tagged.values()) el.removeAttribute(PART);
  };
}
