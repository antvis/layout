#![doc = include_str!("../README.md")]
#![cfg_attr(docsrs, feature(doc_cfg, doc_auto_cfg))]

pub mod force;

mod graph;
mod simulation;

#[cfg(feature = "json")]
/// Import and export graphs with the [jsongraph](http://jsongraphformat.info/) specification.
pub mod json;

pub use glam;
pub use petgraph;

pub use {
    graph::{ForceGraph, ForceGraphHelper},
    simulation::{Dimensions, Node, Simulation, SimulationParameters},
};

mod tests {
    #[test]
    fn json() {
        use super::{json, ForceGraph, ForceGraphHelper};

        let mut graph: ForceGraph<&str, &str> = ForceGraph::default();
        let one = graph.add_force_node("one", "onedata");
        let two = graph.add_force_node("two", "twodata");
        let three = graph.add_force_node("three", "threedata");

        graph.add_edge(one, two, "onetwoedgedata");
        graph.add_edge(two, three, "twothreeedgedata");

        let json = json::graph_to_json(&graph).unwrap();

        let ag = json::graph_from_json(json.to_string()).unwrap();

        assert_eq!(ag.node_count(), 3);
        assert_eq!(ag.edge_count(), 2);

        assert_eq!(
            ag.node_weights()
                .find(|x| x.name == "one")
                .unwrap()
                .data
                .get("metadata")
                .unwrap()
                .to_string()
                .replace('"', ""),
            "onedata".to_string()
        );

        assert!(ag
            .edge_weights()
            .find(|x| x.to_string().replace('"', "") == "onetwoedgedata".to_string())
            .is_some());
    }
}