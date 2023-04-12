export interface Result {
  initSingleThreadHandlers: () => Promise<ForceAtlas2>;
  initMultiThreadHandlers: () => Promise<ForceAtlas2>;
}

export interface ForceAtlas2Options {
  nodes: number;
  edges: number[];
  iterations: number;
  ka: number;
  kg: number;
  kr: number;
  speed: number;
  prevent_overlapping: boolean;
  node_radius: number;
  strong_gravity: boolean;
  lin_log: boolean;
}

type ForceAtlas2 = (options: ForceAtlas2Options) => Promise<{
  positions: number[];
}>;
