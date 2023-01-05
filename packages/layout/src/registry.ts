import { CircularLayout } from "./circular";
import type { SyncLayoutConstructor } from "./types";

export const registry: Record<string, SyncLayoutConstructor<any>> = {
  circular: CircularLayout,
};
export function registerLayout(id: string, layout: SyncLayoutConstructor<any>) {
  registry[id] = layout;
}
