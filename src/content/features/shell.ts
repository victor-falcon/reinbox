import * as drawer from "./shell/drawer";
import * as fab from "./shell/fab";
import * as header from "./shell/header";

// Header with the views control, left nav as an overlay drawer, compose FAB.
export function start(): () => void {
  const stops = [header.start(), drawer.start(), fab.start()];
  return () => {
    for (const stop of stops) stop();
  };
}
