use std::fmt;

use crate::force::{self, Force};

use super::ForceGraph;
use glam::Vec3;
use petgraph::{
    graph::NodeIndex,
    visit::{EdgeRef, IntoEdgeReferences},
    EdgeType, Undirected,
};
use quad_rand::RandomRange;

/// Number of dimensions to run the simulation in.
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum Dimensions {
    Two,
    Three,
}

impl fmt::Display for Dimensions {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Dimensions::Two => write!(f, "2"),
            Dimensions::Three => write!(f, "3"),
        }
    }
}

/// Parameters for the simulation.
#[derive(Clone)]
pub struct SimulationParameters<N, E, Ty = Undirected> {
    /// The width and height of the box that the nodes randomly start in at the beginning of the simulation.
    pub node_start_size: f32,
    /// The number of dimensions that the simulation will run in.
    pub dimensions: Dimensions,
    /// The force that dictates how the simulation behaves.
    force: Force<N, E, Ty>,
}

impl<N, E, Ty: EdgeType> SimulationParameters<N, E, Ty> {
    /// Create a new [`SimulationParameters`].
    pub fn new(node_start_size: f32, dimensions: Dimensions, force: Force<N, E, Ty>) -> Self {
        Self {
            node_start_size,
            dimensions,
            force,
        }
    }

    /// Retrieve a mutable reference to the internal [`Force`].
    pub fn force_mut(&mut self) -> &mut Force<N, E, Ty> {
        &mut self.force
    }

    /// Retrieve a reference to the internal [`Force`].
    pub fn force(&self) -> &Force<N, E, Ty> {
        &self.force
    }

    /// Create a new [`SimulationParameters`] from a [`Force`].
    pub fn from_force(force: Force<N, E, Ty>) -> Self {
        Self {
            force,
            ..Default::default()
        }
    }

    /// Set the internal [`Force`].
    pub fn set_force(&mut self, force: Force<N, E, Ty>) {
        self.force = force;
    }
}

impl<N, E, Ty: EdgeType> Default for SimulationParameters<N, E, Ty> {
    fn default() -> Self {
        Self {
            node_start_size: 200.0,
            dimensions: Dimensions::Two,
            force: force::fruchterman_reingold(45.0, 0.975),
        }
    }
}

/// A simulation for managing the main event loop and forces.
#[derive(Clone)]
pub struct Simulation<N, E, Ty = Undirected> {
    graph: ForceGraph<N, E, Ty>,
    parameters: SimulationParameters<N, E, Ty>,
}

impl<N, E, Ty: EdgeType> Simulation<N, E, Ty> {
    /// Create a simulation from a [`ForceGraph`].
    pub fn from_graph(
        graph: ForceGraph<N, E, Ty>,
        parameters: SimulationParameters<N, E, Ty>,
    ) -> Self {
        let mut myself = Self { graph, parameters };

        myself.reset_node_placement();

        myself
    }

    /// Randomly place the nodes within the starting square.
    /// In practice, this restarts the simulation.
    pub fn reset_node_placement(&mut self) {
        let half_node_start_width = self.parameters.node_start_size / 2.0;

        for node in self.graph.node_weights_mut() {
            let random_location = Vec3::new(
                RandomRange::gen_range(-half_node_start_width, half_node_start_width),
                RandomRange::gen_range(-half_node_start_width, half_node_start_width),
                match self.parameters.dimensions {
                    Dimensions::Three => RandomRange::gen_range(-half_node_start_width, half_node_start_width),
                    Dimensions::Two => 0.0,
                }
            );
           
            node.velocity = Vec3::ZERO;
            node.location = random_location;
            node.old_location = random_location;
        }
    }

    /// Update the graph's node's positions for a given interval.
    pub fn update(&mut self, dt: f32) {
        self.parameters.force().update(&mut self.graph, dt);
    }

    /// Update the graph's node's positions for a given interval with a custom [`Force`].
    pub fn update_custom(&mut self, force: &Force<N, E, Ty>, dt: f32) {
        force.update(&mut self.graph, dt)
    }

    /// Run a callback on all the nodes.
    pub fn visit_nodes(&self, cb: &mut impl Fn(&Node<N>)) {
        for n_idx in self.graph.node_indices() {
            cb(&self.graph[n_idx]);
        }
    }

    /// Run a callback on all of the edges.
    pub fn visit_edges(&self, cb: &mut impl Fn(&Node<N>, &Node<N>)) {
        for edge_ref in self.graph.edge_references() {
            cb(
                &self.graph[edge_ref.source()],
                &self.graph[edge_ref.target()],
            );
        }
    }

    /// Retrieve a reference to the internal [`ForceGraph`].
    pub fn get_graph(&self) -> &ForceGraph<N, E, Ty> {
        &self.graph
    }

    /// Retrieve a mutable reference to the internal [`ForceGraph`].
    pub fn get_graph_mut(&mut self) -> &mut ForceGraph<N, E, Ty> {
        &mut self.graph
    }

    /// Set the internal [`ForceGraph`].
    pub fn set_graph(&mut self, graph: ForceGraph<N, E, Ty>) {
        self.graph = graph;
    }

    /// Retrieve a reference to the internal [`SimulationParameters`].
    pub fn parameters(&self) -> &SimulationParameters<N, E, Ty> {
        &self.parameters
    }

    /// Retreive a mutable reference to the internal [`SimulationParameters`].
    pub fn parameters_mut(&mut self) -> &mut SimulationParameters<N, E, Ty> {
        &mut self.parameters
    }

    /// Retreive a node from the graph based on a query.
    pub fn find(&self, query: Vec3, radius: f32) -> Option<NodeIndex> {
        let query_x = (query.x - radius)..=(query.x + radius);
        let query_y = (query.y - radius)..=(query.y + radius);
        let query_z = (query.z - radius)..=(query.z + radius);

        for index in self.graph.node_indices() {
            let node = &self.graph[index];

            if query_x.contains(&node.location.x)
                && query_y.contains(&node.location.y)
                && query_z.contains(&node.location.z)
            {
                return Some(index);
            }
        }

        None
    }
}

impl<N, E, Ty: EdgeType> Default for Simulation<N, E, Ty> {
    fn default() -> Self {
        Self::from_graph(ForceGraph::default(), SimulationParameters::default())
    }
}

/// A node on a [`ForceGraph`].
#[derive(Clone, PartialEq)]
#[cfg_attr(feature = "json", derive(serde::Serialize))]
pub struct Node<N> {
    /// The name of the node.
    pub name: String,
    /// Any arbitrary information you want to store within it.
    pub data: N,
    pub location: Vec3,
    pub old_location: Vec3,
    pub velocity: Vec3,
}

impl<N> Node<N> {
    /// Create a new node with it's name and associated data.
    pub fn new(name: impl AsRef<str>, data: N) -> Self {
        Self {
            name: name.as_ref().to_string(),
            data,
            location: Vec3::ZERO,
            old_location: Vec3::ZERO,
            velocity: Vec3::ZERO,
        }
    }

    /// Create a new node with custom coordinates.
    pub fn new_with_coords(name: impl AsRef<str>, data: N, location: Vec3) -> Self {
        Self {
            name: name.as_ref().to_string(),
            data,
            location,
            old_location: Vec3::ZERO,
            velocity: Vec3::ZERO,
        }
    }
}

impl<N: fmt::Debug> fmt::Debug for Node<N> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Node")
            .field("name", &self.name)
            .field("data", &self.data)
            .field("location", &self.location)
            .finish()
    }
}