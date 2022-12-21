// import workerFunction from './webworker.js';

export class Supervisor {
  private worker: Worker;

  constructor() {
    // TODO: listen to the graph-changed events.

    this.spawnWorker();
  }

  spawnWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  private createWorker(fn: Function): Worker {
    const xURL = window.URL || window.webkitURL;
    const code = fn.toString();
    const objectUrl = xURL.createObjectURL(
      new Blob(["(" + code + ").call(this);"], { type: "text/javascript" })
    );
    const worker = new Worker(objectUrl);
    xURL.revokeObjectURL(objectUrl);

    return worker;
  }
}
