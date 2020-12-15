import { Base } from "../layout/base";
import { isObject } from "../util"

const map: Map<string, any> = new Map()

export const registerLayout = (name: string, layoutOverroden: any) => {
  if (map.get(name)) {
    throw new Error(`The layout with the name ${name} exists already`)
  }
  if (isObject(layoutOverroden)) {
    // tslint:disable-next-line: max-classes-per-file
    class GLayout extends Base {
      constructor(cfg: any) {
        super()
        const self = this as any
        const props: any = {}
        const defaultCfg = self.getDefaultCfg()
        Object.assign(props, defaultCfg, layoutOverroden, cfg as unknown)
        Object.keys(props).forEach((key: string) => {
          const value = props[key]
          self[key] = value
        })
      }
    }
    map.set(name, GLayout);
  } else {
    map.set(name, layoutOverroden);
  }
}

export const unRegisterLayout = (name: string) => {
  if (map.has(name)) {
    map.delete(name)
  }
}

export const getLayoutByName = (name: string) => {
  if (map.has(name)) {
    return map.get(name)
  }
  return null
}
