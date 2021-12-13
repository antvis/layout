import { graphlib as IGraphLib } from '../../graphlib';
import barycenter from './barycenter';
import resolveConflicts from './resolve-conflicts';
import sort from './sort';

type Graph = IGraphLib.Graph;

const sortSubgraph = (g: Graph, v: string, cg: Graph, biasRight: any, usePrev?: any) => {
  let movable = g.children(v);
  // fixorder的点不参与排序（这个方案不合适，只排了新增节点，和原来的分离）
  const node = g.node(v);
  const bl = node ? node.borderLeft : undefined;
  const br = node ? node.borderRight: undefined;
  const subgraphs: any = {};

  if (bl) {
    movable = movable?.filter((w) => {
      return w !== bl && w !== br;
    });
  }

  const barycenters = barycenter(g, movable || []);
  barycenters.forEach((entry) => {
    if (g.children(entry.v)?.length) {
      const subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
      subgraphs[entry.v] = subgraphResult;
      if (subgraphResult.hasOwnProperty("barycenter")) {
        mergeBarycenters(entry, subgraphResult);
      }
    }
  });

  const entries = resolveConflicts(barycenters, cg);
  expandSubgraphs(entries, subgraphs);

  // 添加fixorder信息到entries里边
  // TODO: 不考虑复合情况，只用第一个点的fixorder信息，后续考虑更完备的实现
  entries.forEach((e) => {
    const node = g.node(e.vs[0]);
    e.fixorder = node.fixorder;
    e.order = node.order;
  });

  const result = sort(entries, biasRight, usePrev);

  if (bl) {
    // @ts-ignore
    result.vs = [bl, result.vs, br].flat();
    if (g.predecessors(bl)?.length) {
      const blPred = g.node(g.predecessors(bl)?.[0] || {});
      const brPred = g.node(g.predecessors(br)?.[0] || {});
      if (!result.hasOwnProperty("barycenter")) {
        result.barycenter = 0;
        result.weight = 0;
      }
      result.barycenter = (result.barycenter * result.weight +
                           (blPred.order as number) + (brPred.order as number)) / (result.weight + 2);
      result.weight += 2;
    }
  }

  return result;
};

const expandSubgraphs = (entries: any, subgraphs: any) => {
  entries.forEach((entry: any) => {
    const vss = entry.vs.map((v: string) => {
      if (subgraphs[v]) {
        return subgraphs[v].vs;
      }
      return v;
    });
    entry.vs = vss.flat();
  });
};

const mergeBarycenters = (target: any, other: any) => {
  if (target.barycenter !== undefined) {
    target.barycenter = (target.barycenter * target.weight +
                         other.barycenter * other.weight) /
                        (target.weight + other.weight);
    target.weight += other.weight;
  } else {
    target.barycenter = other.barycenter;
    target.weight = other.weight;
  }
};

export default sortSubgraph;