import { SELECTORS } from "../../gmail";

// Gmail's left nav, hidden by shell.css, opens as an overlay drawer from the
// header's menu button.
const OPEN_CLASS = "ri-drawer-open";

function isActivation(event: Event): boolean {
  if (event.type === "click") return true;
  return event instanceof KeyboardEvent && (event.key === "Enter" || event.key === " ");
}

export function start(): () => void {
  const root = document.documentElement;
  const scrim = document.createElement("div");
  scrim.className = "ri-scrim";
  // Gmail sets aria-expanded for its own collapse state; restored on cleanup.
  let menuExpanded: { menu: Element; value: string | null } | undefined;

  function setOpen(open: boolean): void {
    root.classList.toggle(OPEN_CLASS, open);
    const menu = document.querySelector(SELECTORS.menuButton);
    if (menu) {
      if (menuExpanded?.menu !== menu) menuExpanded = { menu, value: menu.getAttribute("aria-expanded") };
      menu.setAttribute("aria-expanded", String(open));
    }
    if (open && !scrim.isConnected) document.body.append(scrim);
    if (open) document.querySelector<HTMLElement>(`${SELECTORS.leftNav} a[href]`)?.focus();
  }

  const isOpen = () => root.classList.contains(OPEN_CLASS);

  // Capture phase, so Gmail's own collapse logic never sees the menu button.
  function onMenuEvent(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(SELECTORS.menuButton)) return;
    if (event instanceof KeyboardEvent && !isActivation(event)) return;

    // The collapsed icon rail has no labels. Let Gmail expand it (once) so
    // the drawer shows the full nav.
    const collapsed = document.querySelector(SELECTORS.leftNavCollapsed);
    if (!collapsed) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (isActivation(event)) setOpen(collapsed ? true : !isOpen());
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !isOpen()) return;
    event.stopPropagation();
    setOpen(false);
    document.querySelector<HTMLElement>(SELECTORS.menuButton)?.focus();
  }

  const close = () => setOpen(false);
  const menuEvents = ["mousedown", "mouseup", "click", "keydown"] as const;

  for (const type of menuEvents) window.addEventListener(type, onMenuEvent, true);
  window.addEventListener("keydown", onKeydown, true);
  // Navigating from the drawer (a view, a label) changes the hash.
  window.addEventListener("hashchange", close);
  scrim.addEventListener("click", close);

  return () => {
    for (const type of menuEvents) window.removeEventListener(type, onMenuEvent, true);
    window.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("hashchange", close);
    root.classList.remove(OPEN_CLASS);
    scrim.remove();
    if (menuExpanded) {
      const { menu, value } = menuExpanded;
      if (value === null) menu.removeAttribute("aria-expanded");
      else menu.setAttribute("aria-expanded", value);
    }
  };
}
