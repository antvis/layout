/** layout message type */
export const LAYOUT_MESSAGE = {
  // run layout
  RUN: "LAYOUT_RUN",
  // layout ended with success
  END: "LAYOUT_END",
  // layout error
  ERROR: "LAYOUT_ERROR",
  // layout tick, used in force directed layout
  TICK: "LAYOUT_TICK",
  GPURUN: "GPU_LAYOUT_RUN",
  GPUEND: "GPU_LAYOUT_END"
};

export const FORCE_LAYOUT_TYPE_MAP: { [key: string]: boolean } = {
  'gForce': true,
  'fruchterman': true,
  'forceAtlas2': true,
  'force': true,
  'graphin-force': true,
};