// eslint-disable-next-line no-redeclare
/* global window */

import glib from 'graphlib';

let graphlib = glib;

if (!graphlib && typeof window !== "undefined") {
  graphlib = (window as any).graphlib;
}

console.log('graphlib', graphlib, glib);
export default graphlib;

// let graphlib: any;

// if (typeof require === "function") {
//   try {
//     graphlib = require("graphlib");
//   } catch (e) {
//     // continue regardless of error
//   }
// }

// if (!graphlib && typeof window !== "undefined") {
//   console.log('fetch lib from window');
//   graphlib = (window as any).graphlib;
// }

// console.log('graphlib', graphlib)

// export default graphlib;
