import { registerLayout } from "@antv/layout";
import { FruchtermanLayout } from "./fruchterman";
import { GForceLayout } from "./gforce";

registerLayout("fruchtermanGPU", FruchtermanLayout);
registerLayout("gforce", GForceLayout);

export * from "./fruchterman";
export * from "./gforce";
