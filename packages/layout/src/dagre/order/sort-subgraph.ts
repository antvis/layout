import { ID } from "@antv/graphlib";
import { Graph } from "../../types";
import { barycenter } from "./barycenter";
import resolveConflicts, { ConflictEntry } from "./resolve-conflicts";
import { sort } from "./sort";

export const sortSubgraph = (
  g: Graph,
  v: ID,
  cg: Graph,
  biasRight?: boolean,
  usePrev?: boolean,
  keepNodeOrder?: boolean
) => {
  let movable = g.getChildren(v).map((n) => n.id);
  // fixorder的点不参与排序（这个方案不合适，只排了新增节点，和原来的分离）
  const node = g.getNode(v)!;
  const bl = node ? (node.data.borderLeft as ID) : undefined;
  const br = node ? (node.data.borderRight as ID) : undefined;
  const subgraphs: Record<string, Partial<ConflictEntry>> = {};

  if (bl) {
    movable = movable?.filter((w) => {
      return w !== bl && w !== br;
    });
  }

  const barycenters = barycenter(g, movable || []);
  barycenters?.forEach((entry) => {
    if (g.getChildren(entry.v)?.length) {
      const subgraphResult = sortSubgraph(
        g,
        entry.v,
        cg,
        biasRight,
        keepNodeOrder
      );
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
  entries
    .filter((e) => e.vs.length > 0)
    ?.forEach((e) => {
      const node = g.getNode(e.vs[0])!;
      if (node) {
        e.fixorder = node.data.fixorder as number;
        e.order = node.data.order as number;
      }
    });

  const result = sort(entries, biasRight, usePrev, keepNodeOrder);

  if (bl) {
    result.vs = [bl, result.vs, br].flat() as ID[];
    if (g.getPredecessors(bl)?.length) {
      const blPred = g.getNode(g.getPredecessors(bl)?.[0].id || "")!;
      const brPred = g.getNode(g.getPredecessors(br!)?.[0].id || "")!;
      if (!result.hasOwnProperty("barycenter")) {
        result.barycenter = 0;
        result.weight = 0;
      }
      result.barycenter =
        (result.barycenter! * result.weight! +
          (blPred.data.order as number) +
          (brPred.data.order as number)) /
        (result.weight! + 2);
      result.weight! += 2;
    }
  }

  return result;
};

const expandSubgraphs = (
  entries: ConflictEntry[],
  subgraphs: Record<string, Partial<ConflictEntry>>
) => {
  entries?.forEach((entry) => {
    const vss = entry.vs?.map((v: string) => {
      if (subgraphs[v]) {
        return subgraphs[v].vs!;
      }
      return v;
    });
    entry.vs = vss.flat();
  });
};

const mergeBarycenters = (
  target: { weight?: number; barycenter?: number },
  other: { weight?: number; barycenter?: number }
) => {
  if (target.barycenter !== undefined) {
    target.barycenter =
      (target.barycenter * target.weight! + other.barycenter! * other.weight!) /
      (target.weight! + other.weight!);
    target.weight! += other.weight!;
  } else {
    target.barycenter = other.barycenter;
    target.weight = other.weight;
  }
};
