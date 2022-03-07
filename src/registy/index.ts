import { SafeAny } from '../layout';
import { Base } from '../layout/base';
import { isObject } from '../util';

const map: Map<string, SafeAny> = new Map();

export const registerLayout = (name: string, layoutOverride: SafeAny): SafeAny => {
  if (map.get(name)) {
    console.warn(`The layout with the name ${name} exists already, it will be overridden`);
  }
  if (isObject(layoutOverride)) {
    // tslint:disable-next-line: max-classes-per-file
    class GLayout extends Base {
      constructor(cfg: SafeAny) {
        super();
        const self = this as SafeAny;
        const props: SafeAny = {};
        const defaultCfg = self.getDefaultCfg();
        Object.assign(props, defaultCfg, layoutOverride, cfg as unknown);
        Object.keys(props).forEach((key: string) => {
          const value = props[key];
          self[key] = value;
        });
      }
    }
    map.set(name, GLayout);
  } else {
    map.set(name, layoutOverride);
  }
  return map.get(name);
};

export const unRegisterLayout = (name: string): void => {
  if (map.has(name)) {
    map.delete(name);
  }
};

export const getLayoutByName = (name: string): SafeAny => {
  if (map.has(name)) {
    return map.get(name);
  }
  return null;
};
