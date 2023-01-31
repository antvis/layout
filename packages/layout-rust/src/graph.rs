use super::Node;
use glam::Vec3;
use petgraph::{graph::NodeIndex, stable_graph::StableGraph, EdgeType, Undirected};

/// A helper type that creates a [`StableGraph`] with our custom [`Node`] as the weight.
pub type ForceGraph<N, E, Ty = Undirected> = StableGraph<Node<N>, E, Ty>;

/// Syntactic sugar to make adding [`Node`]s to a [`ForceGraph`] easier.
pub trait ForceGraphHelper<N, E, Ty> {
    /// Add a [`Node`] to the graph with only the name and arbitrary data.
    fn add_force_node(&mut self, name: impl AsRef<str>, data: N) -> NodeIndex;
    /// Add a [`Node`] to the graph with the name, arbitrary data, and a custom location.
    fn add_force_node_with_coords(
        &mut self,
        name: impl AsRef<str>,
        data: N,
        location: Vec3,
    ) -> NodeIndex;
}

impl<N, E, Ty: EdgeType> ForceGraphHelper<N, E, Ty> for ForceGraph<N, E, Ty> {
    fn add_force_node(&mut self, name: impl AsRef<str>, data: N) -> NodeIndex {
        self.add_node(Node::new(name, data))
    }

    fn add_force_node_with_coords(
        &mut self,
        name: impl AsRef<str>,
        data: N,
        location: Vec3,
    ) -> NodeIndex {
        self.add_node(Node::new_with_coords(name, data, location))
    }
}