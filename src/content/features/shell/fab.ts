import { SELECTORS, onDomChange } from "../../gmail";
import { t } from "../../i18n";

const SVG_NS = "http://www.w3.org/2000/svg";

// Pencil from the Focus mockup. Built node by node: Gmail enforces Trusted
// Types, so assigning markup to innerHTML throws.
function pencilIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  const attrs: Record<string, string> = {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  };
  for (const [name, value] of Object.entries(attrs)) svg.setAttribute(name, value);
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M5 19l1-4L16 5l3 3L9 18z");
  svg.append(path);
  return svg;
}

// Gmail's compose button reacts to the full mouse sequence, not to click alone.
function openCompose(): void {
  const compose = document.querySelector(SELECTORS.composeButton);
  if (!compose) {
    // Gmail also opens compose from this hash.
    location.hash = "#inbox?compose=new";
    return;
  }
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
  button.append(pencilIcon());
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
