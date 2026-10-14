import { SELECTORS, onDomChange } from "../../gmail";
import { t } from "../../i18n";

// Pencil from the Focus mockup.
const PENCIL =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19l1-4L16 5l3 3L9 18z"></path></svg>';

// Gmail's compose button reacts to the full mouse sequence, not to click alone.
function openCompose(): void {
  const compose = document.querySelector(SELECTORS.composeButton);
  if (!compose) return;
  for (const type of ["mousedown", "mouseup", "click"]) {
    compose.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  }
}

export function start(): () => void {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ri-fab";
  button.setAttribute("aria-label", t("compose"));
  button.title = t("compose");
  button.innerHTML = PENCIL;
  button.addEventListener("click", openCompose);

  const mount = () => {
    if (!button.isConnected && document.body) document.body.append(button);
  };
  mount();
  const stopObserving = onDomChange(mount);

  return () => {
    stopObserving();
    button.remove();
  };
}
