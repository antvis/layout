use crate::{GraphConfig, GraphEdge, GraphNode};
use graphlib_rust::Graph;

#[derive(Debug, Clone)]
pub struct Barycenter {
    pub v: String,
    pub barycenter: Option<f32>,
    pub weight: Option<f32>,
}

pub fn barycenter(
    g: &Graph<GraphConfig, GraphNode, GraphEdge>,
    movable: &Vec<String>,
) -> Vec<Barycenter> {
    movable
        .iter()
        .map(|v| {
            let in_v = g.in_edges(v, None).unwrap_or(vec![]);
            if in_v.len() == 0 {
                return Barycenter {
                    v: v.clone(),
                    barycenter: None,
                    weight: None,
                };
            }

            //( sum, weight )
            let mut result = (0, 0);
            in_v.iter().for_each(|e| {
                let edge = g.edge_with_obj(&e).unwrap();
                let node_u = g.node(&e.v).unwrap();
                let edge_weight = edge.weight.clone().unwrap_or(0.0) as i32;
                result.0 += edge_weight * (node_u.order.clone().unwrap_or(0) as i32);
                result.1 += edge_weight;
            });

            return Barycenter {
                v: v.clone(),
                barycenter: Some(result.0.clone() as f32 / result.1.clone() as f32),
                weight: Some(result.1 as f32),
            };
        })
        .collect()
}
