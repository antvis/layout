export interface Threads {
  forceatlas2: (
    options: Forceatlas2LayoutOptions
  ) => Promise<{ nodes: number[] }>;
  force2: (options: Force2LayoutOptions) => Promise<{ nodes: number[] }>;
  fruchterman: (
    options: FruchtermanLayoutOptions
  ) => Promise<{ nodes: number[] }>;
  dagre: (options: DagreLayoutOptions) => Promise<{ 
    nodes: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[],
    edges: {
      x: number;
      y: number;
      width: number;
      height: number;
      points: number[];
    }[]
  }>;
}

export interface Forceatlas2LayoutOptions extends ForceLayoutOptions {
  ka: number;
  kg: number;
  kr: number;
  speed: number;
  prevent_overlapping: boolean;
  kr_prime: number;
  node_radius: number;
  strong_gravity: boolean;
  lin_log: boolean;
  dissuade_hubs: boolean;
}
export interface Force2LayoutOptions extends ForceLayoutOptions {
  edge_strength: number;
  link_distance: number;
  node_strength: number;
  coulomb_dis_scale: number;
  factor: number;
  interval: number;
  damping: number;
  kg: number; // gravity
  max_speed: number;
}

export interface FruchtermanLayoutOptions extends ForceLayoutOptions {
  height: number; // height
  width: number; // width
  kg: number; // gravity
  speed: number; // speed
}

export interface ForceLayoutOptions {
  dimensions?: number;
  nodes: number[];
  edges: number[][];
  masses?: number[];
  weights?: number[];
  iterations: number;
  min_movement?: number;
  distance_threshold_mode?: number;
  center?: [number, number] | [number, number, number];
  max_distance?: number;
}

export interface DagreLayoutOptions {
  nodes: number[];
  edges: number[][];
  masses?: number[];
  weights?: number[];
  nodesep?: number;      // default 50
  edgesep?: number;           // default 20
  ranksep?: number;           // default 50
  marginx?: number;           // default 0
  marginy?: number;           // default 0
  rankdir?: 'lr' | 'tb' | 'rl' | 'bt';        // lr, rl, tb, bt // default tb
  align?: 'ul' | 'ur' | 'dl' | 'dr';        // ul, ur, dl, dr // default ul
}

export interface WASMLayoutOptions {
  threads: Threads;
}
