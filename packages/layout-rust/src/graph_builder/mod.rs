pub mod builder;
mod compat;
pub mod graph;
pub mod graph_ops;
pub mod index;
pub mod input;
pub mod prelude;

pub use self::builder::GraphBuilder;
pub use self::graph::csr::CsrLayout;
pub use self::graph::csr::DirectedCsrGraph;
pub use self::graph::csr::UndirectedCsrGraph;

use std::convert::Infallible;

use self::graph::csr::Target;
use thiserror::Error;

use self::index::Idx;

#[derive(Error, Debug)]
pub enum Error {
    #[error("error while loading graph")]
    IoError {
        #[from]
        source: std::io::Error,
    },
    #[error("incompatible index type")]
    IdxError {
        #[from]
        source: std::num::TryFromIntError,
    },
    #[error("invalid partitioning")]
    InvalidPartitioning,
    #[error("number of node values must be the same as node count")]
    InvalidNodeValues,
    #[error("invalid id size, expected {expected:?} bytes, got {actual:?} bytes")]
    InvalidIdType { expected: String, actual: String },
}

impl From<Infallible> for Error {
    fn from(_: Infallible) -> Self {
        unreachable!()
    }
}

/// A graph is a tuple `(N, E)`, where `N` is a set of nodes and `E` a set of
/// edges. Each edge connects exactly two nodes.
///
/// `Graph` is parameterized over the node index type `Node` which is used to
/// uniquely identify a node. An edge is a tuple of node identifiers.
pub trait Graph<NI: Idx> {
    /// Returns the number of nodes in the graph.
    fn node_count(&self) -> NI;

    /// Returns the number of edges in the graph.
    fn edge_count(&self) -> NI;
}

/// A graph that allows storing a value per node.
pub trait NodeValues<NI: Idx, NV> {
    fn node_value(&self, node: NI) -> &NV;
}

pub trait UndirectedDegrees<NI: Idx> {
    /// Returns the number of edges connected to the given node.
    fn degree(&self, node: NI) -> NI;
}

/// Returns the neighbors of a given node.
///
/// The edge `(42, 1337)` is equivalent to the edge `(1337, 42)`.
pub trait UndirectedNeighbors<NI: Idx> {
    type NeighborsIterator<'a>: Iterator<Item = &'a NI>
    where
        Self: 'a;

    /// Returns an iterator of all nodes connected to the given node.
    fn neighbors(&self, node: NI) -> Self::NeighborsIterator<'_>;
}

/// Returns the neighbors of a given node.
///
/// The edge `(42, 1337)` is equivalent to the edge `(1337, 42)`.
pub trait UndirectedNeighborsWithValues<NI: Idx, EV> {
    type NeighborsIterator<'a>: Iterator<Item = &'a Target<NI, EV>>
    where
        Self: 'a,
        EV: 'a;

    /// Returns an iterator of all nodes connected to the given node
    /// including the value of the connecting edge.
    fn neighbors_with_values(&self, node: NI) -> Self::NeighborsIterator<'_>;
}

pub trait DirectedDegrees<NI: Idx> {
    /// Returns the number of edges where the given node is a source node.
    fn out_degree(&self, node: NI) -> NI;

    /// Returns the number of edges where the given node is a target node.
    fn in_degree(&self, node: NI) -> NI;
}

/// Returns the neighbors of a given node either in outgoing or incoming direction.
///
/// An edge tuple `e = (u, v)` has a source node `u` and a target node `v`. From
/// the perspective of `u`, the edge `e` is an **outgoing** edge. From the
/// perspective of node `v`, the edge `e` is an **incoming** edge. The edges
/// `(u, v)` and `(v, u)` are not considered equivalent.
pub trait DirectedNeighbors<NI: Idx> {
    type NeighborsIterator<'a>: Iterator<Item = &'a NI>
    where
        Self: 'a;

    /// Returns an iterator of all nodes which are connected in outgoing direction
    /// to the given node, i.e., the given node is the source node of the
    /// connecting edge.
    fn out_neighbors(&self, node: NI) -> Self::NeighborsIterator<'_>;

    /// Returns an iterator of all nodes which are connected in incoming direction
    /// to the given node, i.e., the given node is the target node of the
    /// connecting edge.
    fn in_neighbors(&self, node: NI) -> Self::NeighborsIterator<'_>;
}

/// Returns the neighbors of a given node either in outgoing or incoming direction.
///
/// An edge tuple `e = (u, v)` has a source node `u` and a target node `v`. From
/// the perspective of `u`, the edge `e` is an **outgoing** edge. From the
/// perspective of node `v`, the edge `e` is an **incoming** edge. The edges
/// `(u, v)` and `(v, u)` are not considered equivale
pub trait DirectedNeighborsWithValues<NI: Idx, EV> {
    type NeighborsIterator<'a>: Iterator<Item = &'a Target<NI, EV>>
    where
        Self: 'a,
        EV: 'a;

    /// Returns an iterator of all nodes which are connected in outgoing direction
    /// to the given node, i.e., the given node is the source node of the
    /// connecting edge. For each connected node, the value of the connecting
    /// edge is also returned.
    fn out_neighbors_with_values(&self, node: NI) -> Self::NeighborsIterator<'_>;

    /// Returns an iterator of all nodes which are connected in incoming direction
    /// to the given node, i.e., the given node is the target node of the
    /// connecting edge. For each connected node, the value of the connecting
    /// edge is also returned.
    fn in_neighbors_with_values(&self, node: NI) -> Self::NeighborsIterator<'_>;
}

#[repr(transparent)]
pub struct SharedMut<T>(*mut T);
unsafe impl<T: Send> Send for SharedMut<T> {}
unsafe impl<T: Sync> Sync for SharedMut<T> {}

impl<T> SharedMut<T> {
    pub fn new(ptr: *mut T) -> Self {
        SharedMut(ptr)
    }

    delegate::delegate! {
        to self.0 {
            /// # Safety
            ///
            /// Ensure that `count` does not exceed the capacity of the Vec.
            pub unsafe fn add(&self, count: usize) -> *mut T;
        }
    }
}
