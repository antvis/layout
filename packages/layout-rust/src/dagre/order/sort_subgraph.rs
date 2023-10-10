use crate::dagre::order::barycenter::{barycenter, Barycenter};
use crate::dagre::order::resolve_conflicts::{resolve_conflicts, ResolvedBaryEntry};
use crate::dagre::order::sort::sort;
use crate::{GraphConfig, GraphEdge, GraphNode};
use graphlib_rust::Graph;
use ordered_hashmap::OrderedHashMap;

#[derive(Debug, Clone, Default)]
pub struct SubgraphResult {
    pub vs: Vec<String>,
    pub barycenter: f32,
    pub weight: f32,
}

pub fn sort_subgraph(
    g: &Graph<GraphConfig, GraphNode, GraphEdge>,
    v: &String,
    cg: &Graph<GraphConfig, GraphNode, GraphEdge>,
    bias_right: &bool,
) -> SubgraphResult {
    let mut movable = g.children(v);
    let node = g.node(v);
    let bl = if node.is_some() {
        node.unwrap().border_left_.clone()
    } else {
        None
    };
    let br = if node.is_some() {
        node.unwrap().border_right_.clone()
    } else {
        None
    };
    let mut subgraphs: OrderedHashMap<String, SubgraphResult> = OrderedHashMap::new();

    if br.is_some() {
        movable = movable
            .into_iter()
            .filter(|w| w != &bl.clone().unwrap() && w != &br.clone().unwrap())
            .collect();
    }

    let mut barycenters = barycenter(g, &movable);
    barycenters.iter_mut().for_each(|entry| {
        if g.children(&entry.v).len() > 0 {
            let subgraph_result = sort_subgraph(g, &entry.v, cg, bias_right);
            subgraphs.insert(entry.v.clone(), subgraph_result.clone());
            merge_barycenters(entry, &subgraph_result);
        }
    });

    let mut entries = resolve_conflicts(&barycenters, cg);
    expand_subgraphs(&mut entries, &subgraphs);

    let mut result = sort(&entries, bias_right);
    if bl.is_some() {
        let bl_ = bl.clone().unwrap();
        let br_ = br.clone().unwrap();
        result.vs = vec![vec![bl_.clone()], result.vs.clone(), vec![br_.clone()]].concat();
        let bl_preds = g.predecessors(&bl_).unwrap_or(vec![]);
        if bl_preds.len() > 0 {
            let bl_pred = g.node(bl_preds.first().unwrap()).unwrap();
            let br_pred = g
                .node(g.predecessors(&br_).unwrap_or(vec![]).first().unwrap())
                .unwrap();
            // not required as it was handled by structs' default
            /*
            if (!_.has(result, "barycenter")) {
              result.barycenter = 0;
              result.weight = 0;
            }
            */
            let bl_pred_order = bl_pred.order.clone().unwrap_or(0) as f32;
            let br_pred_order = br_pred.order.clone().unwrap_or(0) as f32;
            result.barycenter = (result.barycenter * result.weight + bl_pred_order + br_pred_order)
                / (result.weight + 2.0);
            result.weight += 2.0;
        }
    }

    return result;
}

fn expand_subgraphs(
    entries: &mut Vec<ResolvedBaryEntry>,
    subgraphs: &OrderedHashMap<String, SubgraphResult>,
) {
    entries.iter_mut().for_each(|entry| {
        let mut vs: Vec<String> = vec![];
        entry.vs.iter().for_each(|v| {
            if subgraphs.contains_key(v) {
                let subgraph = subgraphs.get(v).unwrap();
                subgraph.vs.iter().for_each(|v_| {
                    vs.push(v_.clone());
                });
                return ();
            }
            vs.push(v.clone());
        });

        entry.vs = vs;
    });
}

fn merge_barycenters(target: &mut Barycenter, other: &SubgraphResult) {
    let target_barycenter = target.barycenter.clone().unwrap_or(0.0);
    if target.barycenter.is_some() && target_barycenter > 0.0 {
        let target_weight = target.weight.clone().unwrap_or(0.0);

        target.barycenter = Some(
            (target_barycenter * target_weight + other.barycenter * other.weight)
                / (target_weight + other.weight),
        );
        target.weight = Some(target_weight + other.weight.clone());
    } else {
        target.barycenter = Some(other.barycenter.clone());
        target.weight = Some(other.weight.clone());
    }
}
