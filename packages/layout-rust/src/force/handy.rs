use glam::Vec3;
use hashlink::LinkedHashMap;
use petgraph::{graph::NodeIndex, EdgeType};

use crate::{
    force::{
        fruchterman_reingold::{fr_get_attraction, fr_get_repulsion},
        Value,
    },
    ForceGraph,
};

use super::Force;

/// My own force-directed graph drawing algorithm.
pub fn handy<N, E, Ty: EdgeType>(
    scale: f32,
    cooloff_factor: f32,
    gravity: bool,
    centering: bool,
) -> Force<N, E, Ty> {
    fn update<N, E, Ty: EdgeType>(
        dict: &LinkedHashMap<String, Value>,
        graph: &mut ForceGraph<N, E, Ty>,
        dt: f32,
    ) {
        // establish current variables from the force's dictionary
        let repulsion = dict.get("Repulsive Force").unwrap().bool().unwrap();
        let attraction = dict.get("Attractive Force").unwrap().bool().unwrap();
        let scale = dict.get("Scale").unwrap().number().unwrap();
        let cooloff_factor = dict.get("Cooloff Factor").unwrap().number().unwrap();
        let gravity_factor = dict.get("Gravity Factor").unwrap().number().unwrap();
        let centering = dict.get("Centering").unwrap().bool().unwrap();
        let gravity = dict.get("Gravity").unwrap().bool().unwrap();

        // sum of all locations (for centering)
        let mut loc_sum = Vec3::ZERO;

        // reset all old locations
        graph
            .node_weights_mut()
            .for_each(|n| n.old_location = n.location);

        // loop through all nodes
        for idx in graph.node_indices().collect::<Vec<NodeIndex>>() {
            if centering {
                loc_sum += graph[idx].old_location
            }

            // force that will be applied to the node
            let mut force = Vec3::ZERO;

            if repulsion {
                force += fr_get_repulsion(idx, scale, &graph);
            }

            if attraction {
                force += fr_get_attraction(idx, scale, &graph);
            }

            if gravity {
                let node = &graph[idx];

                force += -node.old_location / (1.0 / gravity_factor);
            }

            // apply new location
            let node = &mut graph[idx];

            node.velocity += force * dt;
            node.velocity *= cooloff_factor;

            node.location += node.velocity * dt;
        }

        if centering {
            let avg_vec = loc_sum / graph.node_count() as f32;

            for idx in graph.node_indices().collect::<Vec<NodeIndex>>() {
                let node = &mut graph[idx];

                node.location -= avg_vec;
            }
        }
    }

    let mut dict = LinkedHashMap::new();
    dict.insert("Repulsive Force".to_string(), Value::Bool(true));
    dict.insert("Attractive Force".to_string(), Value::Bool(true));
    dict.insert("Scale".to_string(), Value::Number(scale, 1.0..=200.0));
    dict.insert(
        "Cooloff Factor".to_string(),
        Value::Number(cooloff_factor, 0.0..=1.0),
    );
    dict.insert("Gravity Factor".to_string(), Value::Number(1.0, 0.1..=5.0));
    dict.insert("Centering".to_string(), Value::Bool(centering));
    dict.insert("Gravity".to_string(), Value::Bool(gravity));

    Force {
        dict: dict.clone(),
        dict_default: dict,
        name: "Handy",
        continuous: true,
        info: Some("Force Directed Algorithm by Grant Handy (2022)"),
        update,
    }
}