
import glib from '@dagrejs/graphlib';

let graphlib = glib;


if (!graphlib && typeof window !== "undefined") {
  graphlib = (window as any).graphlib;
}

export default graphlib;
