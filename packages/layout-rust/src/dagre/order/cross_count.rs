use crate::{GraphConfig, GraphEdge, GraphNode};
use graphlib_rust::Graph;
use ordered_hashmap::OrderedHashMap;

/*
 * A function that takes a layering (an array of layers, each with an array of
 * ordererd nodes) and a graph and returns a weighted crossing count.
 *
 * Pre-conditions:
 *
 *    1. Input graph must be simple (not a multigraph), directed, and include
 *       only simple edges.
 *    2. Edges in the input graph must have assigned weights.
 *
 * Post-conditions:
 *
 *    1. The graph and layering matrix are left unchanged.
 *
 * This algorithm is derived from Barth, et al., "Bilayer Cross Counting."
 */

pub fn cross_count(
    g: &mut Graph<GraphConfig, GraphNode, GraphEdge>,
    layering: &mut Vec<Vec<String>>,
) -> usize {
    let mut cc = 0;
    let mut i = 1;
    while i < layering.len() {
        cc += two_layer_cross_count(g, layering, &(i - 1), &i);
        i += 1;
    }

    return cc;
}

pub fn two_layer_cross_count(
    g: &mut Graph<GraphConfig, GraphNode, GraphEdge>,
    layering: &mut Vec<Vec<String>>,
    north_idx: &usize,
    south_idx: &usize,
) -> usize {
    // Sort all of the edges between the north and south layers by their position
    // in the north layer and then the south. Map these edges to the position of
    // their head in the south layer.
    let mut south_pos: OrderedHashMap<String, usize> = OrderedHashMap::new();
    let south_layer = layering.get(south_idx.clone()).cloned().unwrap_or(vec![]);
    south_layer.iter().enumerate().for_each(|(idx, val)| {
        south_pos.insert(val.clone(), idx);
    });

    // (pos, weight)
    let south_entries: Vec<(usize, f32)> = layering
        .get(north_idx.clone())
        .cloned()
        .unwrap_or(vec![])
        .into_iter()
        .map(|v| -> Vec<(usize, f32)> {
            let mut out_edges: Vec<(usize, f32)> = g
                .out_edges(&v, None)
                .unwrap_or(vec![])
                .into_iter()
                .map(|e| {
                    let pos = south_pos.get(&e.w).cloned().unwrap_or(0);
                    let label = g.edge_with_obj(&e).cloned().unwrap();
                    (pos, label.weight.unwrap_or(0.0))
                })
                .collect();
            out_edges.sort_by(|e1, e2| e1.0.cmp(&e2.0));

            out_edges
        })
        .collect::<Vec<Vec<(usize, f32)>>>()
        .concat();

    // Build the accumulator tree
    let mut first_index = 1;
    while first_index < south_layer.len() {
        first_index <<= 1;
    }

    let tree_size = 2 * first_index - 1;
    first_index -= 1;

    let mut tree: Vec<usize> = vec![0; tree_size];

    // Calculate the weighted crossings
    let mut cc = 0;
    south_entries.iter().for_each(|entry| {
        let mut idx = entry.0 + first_index;
        tree.insert(idx, tree[idx] + (entry.1 as usize));

        let mut weight_sum: usize = 0;
        while idx > 0 {
            if idx % 2 != 0 {
                weight_sum += tree[idx + 1];
            }
            idx = (idx - 1) >> 1;
            tree[idx] += entry.1 as usize;
        }
        cc += entry.1 as usize * weight_sum;
    });

    cc
}
