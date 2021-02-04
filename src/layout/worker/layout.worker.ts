/**
 * @fileoverview web worker for layout
 * @author changzhe.zb@antfin.com
 */
import { getLayoutByName } from "../../registy";
import { LAYOUT_MESSAGE } from "./layoutConst";

interface Event {
  type: string;
  data: any;
}

class LayoutWorker {
  // listen to message posted to web worker
  onmessage = (event: Event) => {
    if (this.isLayoutMessage(event)) {
      this.handleLayoutMessage(event, postMessage);
    }
  };

  isLayoutMessage(event: Event) {
    const { type } = event.data;
    return type === LAYOUT_MESSAGE.RUN || type === LAYOUT_MESSAGE.GPURUN;
  }

  handleLayoutMessage(event: Event, postMessage: any) {
    const { type } = event.data;

    switch (type) {
      case LAYOUT_MESSAGE.RUN: {
        const { nodes, edges, layoutCfg = {} } = event.data;
        const { type: layoutType } = layoutCfg;
        const LayoutClass = getLayoutByName(layoutType); // tslint:disable-line
        if (!LayoutClass) {
          postMessage({
            type: LAYOUT_MESSAGE.ERROR,
            message: `layout ${layoutType} not found`
          });
          break;
        }

        const layoutMethod = new LayoutClass(layoutCfg);
        layoutMethod.init({ nodes, edges });
        layoutMethod.execute();
        postMessage({ nodes, type: LAYOUT_MESSAGE.END });
        layoutMethod.destroy();
        break;
      }

      case LAYOUT_MESSAGE.GPURUN: {
        const { nodes, edges, layoutCfg = {}, canvas } = event.data;

        const { type: layoutType } = layoutCfg;

        const LayoutClass = getLayoutByName(layoutType); // tslint:disable-line
        if (!LayoutClass) {
          postMessage({
            type: LAYOUT_MESSAGE.ERROR,
            message: `layout ${layoutType} not found`
          });
          break;
        }
        if (layoutType.split("-")[1] !== "gpu") {
          postMessage({
            type: LAYOUT_MESSAGE.ERROR,
            message: `layout ${layoutType} does not support GPU`
          });
          break;
        }

        const layoutMethod = new LayoutClass(layoutCfg);
        layoutMethod.init({ nodes, edges });
        layoutMethod.executeWithWorker(canvas, new (LayoutWorker as any)());
        break;
      }
      default:
        break;
    }
  }
}

// const LayoutWorker = () => {
//   onmessage = event => {
//     if (isLayoutMessage(event)) {
//       handleLayoutMessage(event, postMessage);
//     }
//   };
// };

// https://stackoverflow.com/questions/50210416/webpack-worker-loader-fails-to-compile-typescript-worker
export default LayoutWorker;
