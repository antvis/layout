// import { getLayoutByName } from "../../registy";
// import { LAYOUT_MESSAGE } from "./layoutConst";
// @ts-ignore
import LayoutWebWorker from "./layout.worker";

export default class WebWorker {
  constructor(worker: WebWorker) {
    const code = LayoutWebWorker.toString();
    console.log(code);

    // const constants = `const LAYOUT_MESSAGE = ${JSON.stringify(
    //   LAYOUT_MESSAGE
    // )}`;
    // const getLayoutName = `const getLayoutByName = ${getLayoutByName}`;
    // console.log(
    //   "webworker code ",
    //   `(() => { ${constants} ${getLayoutName} ${code}})()`
    // );
    const blob = new Blob([`(${code})()`]);
    // const blob = new Blob([`(() => {${code}})()`], {
    //   type: "text/javascript"
    // });
    return new Worker(URL.createObjectURL(blob));
  }
}
