import { Base } from "./base";
import { Model, ILayout } from "./types";
import { registerLayout, getLayoutByName } from "../registy";

export class Layout {
  public readonly layoutInstance: Base;

  constructor(options: ILayout.LayoutOptions) {
    const layoutClass = getLayoutByName(options.type as string);
    this.layoutInstance = new layoutClass(options);
  }

  layout(data: Model) {
    return this.layoutInstance.layout(data);
  }

  updateCfg(cfg: ILayout.LayoutOptions) {
    this.layoutInstance.updateCfg(cfg);
  }

  init(data: Model) {
    this.layoutInstance.init(data);
  }

  execute() {
    this.layoutInstance.execute();
  }

  getDefaultCfg() {
    return this.layoutInstance.getDefaultCfg();
  }

  destroy() {
    return this.layoutInstance.destroy();
  }
}

// FIXME
// FOR G6
export const Layouts: { [key: string]: any } = new Proxy(
  {},
  {
    // tslint:disable-line
    get: (target, propKey) => {
      return getLayoutByName(propKey as string);
    },
    set: (target, propKey, value) => {
      registerLayout(propKey as string, value);
      return true;
    }
  }
);
