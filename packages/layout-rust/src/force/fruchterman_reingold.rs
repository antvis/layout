use glam::Vec3;
use hashlink::LinkedHashMap;
use petgraph::{graph::NodeIndex, visit::EdgeRef, EdgeType};

use crate::{force::Value, ForceGraph};

use super::{unit_vector, Force};

/// A force directed graph drawing algorithm based on Fruchterman-Reingold (1991).
pub fn fruchterman_reingold<N, E, Ty: EdgeType>(
    scale: f32,
    cooloff_factor: f32,
) -> Force<N, E, Ty> {
    fn update<N, E, Ty: EdgeType>(
        dict: &LinkedHashMap<String, Value>,
        graph: &mut ForceGraph<N, E, Ty>,
        dt: f32,
    ) {
        // establish current variables from the force's dictionary
        let scale = dict.get("Scale").unwrap().number().unwrap();
        let cooloff_factor = dict.get("Cooloff Factor").unwrap().number().unwrap();

        // reset all old locations
        graph
            .node_weights_mut()
            .for_each(|n| n.old_location = n.location);

        // loop through all nodes
        for idx in graph.node_indices().collect::<Vec<NodeIndex>>() {
            // force that will be applied to the node
            let mut force = Vec3::ZERO;

            force += fr_get_repulsion(idx, scale, &graph);
            force += fr_get_attraction(idx, scale, &graph);

            // apply new location
            let node = &mut graph[idx];

            node.velocity += force * dt;
            node.velocity *= cooloff_factor;

            node.location += node.velocity * dt;
        }
    }

    let mut dict = LinkedHashMap::new();
    dict.insert("Scale".to_string(), Value::Number(scale, 1.0..=200.0));
    dict.insert(
        "Cooloff Factor".to_string(),
        Value::Number(cooloff_factor, 0.0..=1.0),
    );

    Force {
        dict: dict.clone(),
        dict_default: dict,
        name: "Fruchterman-Reingold (1991)",
        continuous: true,
        info: Some("The force-directed graph drawing algorithm by Fruchterman-Reingold (1991)."),
        update,
    }
}

/// A force directed graph drawing algorithm based on Fruchterman-Reingold (1991), though it multiplies attractions by edge weights.
pub fn fruchterman_reingold_weighted<N, E: Clone + Into<f32>, Ty: EdgeType>(
    scale: f32,
    cooloff_factor: f32,
) -> Force<N, E, Ty> {
    fn update<N, E: Clone + Into<f32>, Ty: EdgeType>(
        dict: &LinkedHashMap<String, Value>,
        graph: &mut ForceGraph<N, E, Ty>,
        dt: f32,
    ) {
        // establish current variables from the force's dictionary
        let scale = dict.get("Scale").unwrap().number().unwrap();
        let cooloff_factor = dict.get("Cooloff Factor").unwrap().number().unwrap();

        // reset all old locations
        graph
            .node_weights_mut()
            .for_each(|n| n.old_location = n.location);

        // loop through all nodes
        for idx in graph.node_indices().collect::<Vec<NodeIndex>>() {
            // force that will be applied to the node
            let mut force = Vec3::ZERO;

            force += fr_get_repulsion(idx, scale, &graph);
            force += fr_get_attraction_weighted(idx, scale, &graph);

            // apply new location
            let node = &mut graph[idx];

            node.velocity += force * dt;
            node.velocity *= cooloff_factor;

            node.location += node.velocity * dt;
        }
    }

    let mut dict = LinkedHashMap::new();
    dict.insert("Scale".to_string(), Value::Number(scale, 1.0..=200.0));
    dict.insert(
        "Cooloff Factor".to_string(),
        Value::Number(cooloff_factor, 0.0..=1.0),
    );

    Force {
        dict: dict.clone(),
        dict_default: dict,
        name: "Weighted Fruchterman-Reingold (1991)",
        continuous: true,
        info: Some(
            "The force-directed graph drawing algorithm by Fruchterman-Reingold (1991). This version multiplies the edge force by the edge weight.",
        ),
        update,
    }
}

pub fn fr_get_repulsion<N, E, Ty: EdgeType>(
    idx: NodeIndex,
    scale: f32,
    graph: &ForceGraph<N, E, Ty>,
) -> Vec3 {
    let mut force = Vec3::ZERO;
    let node = &graph[idx];

    for alt_idx in graph.node_indices() {
        if alt_idx == idx {
            continue;
        }

        let alt_node = &graph[alt_idx];

        force += -((scale * scale) / node.old_location.distance(alt_node.old_location))
            * unit_vector(node.old_location, alt_node.old_location);
    }

    force
}

pub fn fr_get_attraction<N, E, Ty: EdgeType>(
    idx: NodeIndex,
    scale: f32,
    graph: &ForceGraph<N, E, Ty>,
) -> Vec3 {
    let mut force = Vec3::ZERO;
    let node = &graph[idx];

    for alt_idx in graph.neighbors(idx) {
        let alt_node = &graph[alt_idx];

        force += (node.old_location.distance_squared(alt_node.old_location) / scale)
            * unit_vector(node.old_location, alt_node.old_location);
    }

    force
}

pub fn fr_get_attraction_weighted<N, E: Clone + Into<f32>, Ty: EdgeType>(
    idx: NodeIndex,
    scale: f32,
    graph: &ForceGraph<N, E, Ty>,
) -> Vec3 {
    let mut force = Vec3::ZERO;
    let node = &graph[idx];

    for edge in graph.edges(idx) {
        let alt_idx = if edge.source() == idx {
            edge.target()
        } else {
            edge.source()
        };

        let alt_node = &graph[alt_idx];

        let weight: f32 = edge.weight().clone().into();

        force += (node.old_location.distance_squared(alt_node.old_location) / scale)
            * unit_vector(node.old_location, alt_node.old_location)
            * weight;
    }

    force
}