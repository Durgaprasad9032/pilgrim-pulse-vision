import { useSyncExternalStore } from "react";
import { engine } from "./engine";
import type { SimSnapshot } from "./types";

export function useSimulation(): SimSnapshot {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
}

export { engine };
