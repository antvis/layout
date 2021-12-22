// @ts-ignore
import glib from '@dagrejs/graphlib';

let graphlib = glib;


if (!graphlib && typeof window !== "undefined") {
  graphlib = (window as any).graphlib;
}

Object.defineProperty(Array.prototype, 'flat', {
  value: function (depth = 1) {
    return this.reduce((flat: Array<any>, toFlatten: Array<any>) => {
      return flat.concat(
        Array.isArray(toFlatten) && depth > 1
          ? toFlatten.flat(depth - 1)
          : toFlatten
      );
    }, []);
  },
});

export default graphlib;
