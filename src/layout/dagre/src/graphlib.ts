// @ts-ignore
import {Graph, algorithm} from '@antv/graphlib';

let graphlib = {
  Graph, alg: algorithm
};


if (!graphlib && typeof window !== "undefined") {
  graphlib = (window as any).graphlib;
}

if (!(Array as any).prototype.flat) {
  // @ts-ignore
  (Array as any).prototype.flat = function(count) {
    let c = count || 1;
    if (!isFinite(c)) return;
    const len = this.length;
    let ret: any = [];
    if (this.length === 0) return this;
    while (c--) {
      const arr = [];
      let flag = false;
      if (ret.length === 0) {
        flag = true;
        for (let i = 0; i < len; i++) {
          if (this[i] instanceof Array) {
            ret.push(...this[i]);
          } else {
            ret.push(this[i]);
          }
        }
      } else {
        for (let i = 0; i < ret.length; i++) {
          if (ret[i] instanceof Array) {
            flag = true;
            arr.push(...ret[i]);
          } else {
            arr.push(ret[i]);
          }
        }
        ret = arr;
      }
      if (!flag && c === Infinity) {
        break;
      }
    }
    return ret;
  };

}

export default graphlib;
