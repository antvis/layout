/**
 * @see https://github.com/dagrejs/dagre/blob/master/lib/greedy-fas.js
 */

use crate::{GraphConfig, GraphEdge, GraphNode};
use graphlib_rust::{Edge, Graph};

pub fn greedy_fas(graph: &mut Graph<GraphConfig, GraphNode, GraphEdge>) -> Vec<Edge> {
    let mut fas: Vec<Edge> = vec![];
    if graph.node_count() <= 1 {
        return fas;
    }
    return fas;
}