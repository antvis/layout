use crate::{iter::*, util::*};

use rayon::prelude::*;
use std::marker::PhantomData;

#[derive(Clone)]
pub enum LayoutType {
    ForceAtlas2,
    Force2,
    Fruchterman,
}

#[derive(Clone)]
pub struct Settings<T: Coord> {
    pub name: LayoutType,
    /// Number of nodes computed by each thread
    ///
    /// Only used in repulsion computation. Set to `None` to turn off parallelization.
    /// This number should be big enough to minimize thread management,
    /// but small enough to maximize concurrency.
    ///
    /// Requires `T: Send + Sync`
    pub chunk_size: Option<usize>,
    /// Number of spatial dimensions
    pub dimensions: usize,
    /// Move hubs (high degree nodes) to the center
    pub dissuade_hubs: bool,
    /// Attraction coefficient
    pub ka: T,
    /// Gravity coefficient
    pub kg: T,
    /// Repulsion coefficient
    pub kr: T,
    /// Logarithmic attraction
    pub lin_log: bool,
    /// Prevent node overlapping for a prettier graph (node_size, kr_prime).
    ///
    /// `node_size` is the radius around a node where the repulsion coefficient is `kr_prime`.
    /// `kr_prime` is arbitrarily set to `100.0` in Gephi implementation.
    pub prevent_overlapping: Option<(T, T)>,
    /// Speed factor
    pub speed: T,
    /// Gravity does not decrease with distance, resulting in a more compact graph.
    pub strong_gravity: bool,

    /// Used in Force2 layout.
    pub link_distance: T,
    /// The strength of edge force. Calculated according to the degree of nodes by default
    pub edge_strength: T,
    /// The strength of node force. Positive value means repulsive force, negative value means attractive force (it is different from 'force')
    pub node_strength: T,
    /// A parameter for repulsive force between nodes. Large the number, larger the repulsion.
    pub coulomb_dis_scale: T,
    /// Coefficient for the repulsive force. Larger the number, larger the repulsive force.
    pub factor: T,
    pub damping: T,
    pub interval: T,
    pub max_speed: T,
    pub min_movement: T,

    /// Used in Fruchterman layout.
    pub center: Vec<T>,
}

impl<T: Coord> Default for Settings<T> {
    fn default() -> Self {
        Self {
            chunk_size: Some(256),
            dimensions: 2,
            dissuade_hubs: false,
            ka: T::one(),
            kg: T::one(),
            kr: T::one(),
            lin_log: false,
            prevent_overlapping: None,
            speed: T::from(0.01).unwrap_or_else(T::one),
            strong_gravity: false,
            name: LayoutType::ForceAtlas2,
            link_distance: T::one(),
            edge_strength: T::one(),
            node_strength: T::one(),
            coulomb_dis_scale: T::one(),
            factor: T::one(),
            damping: T::one(),
            interval: T::one(),
            center: vec![T::zero(); 2],
            max_speed: T::one(),
            min_movement: T::zero(),
        }
    }
}

pub struct Layout<T: Coord> {
    pub edges: Vec<Edge>,
    pub masses: Vec<T>,
    /// List of the nodes' positions
    pub points: PointList<T>,
    pub(crate) settings: Settings<T>,
    pub speeds: PointList<T>,
    pub old_speeds: PointList<T>,
    pub weights: Option<Vec<T>>,

    pub(crate) fn_attraction: fn(&mut Self),
    pub(crate) fn_gravity: fn(&mut Self),
    pub(crate) fn_repulsion: fn(&mut Self),
}

impl<T: Coord> Layout<T> {
    pub fn iter_nodes(&mut self) -> NodeIter<T> {
        NodeIter {
            ind: 0,
            layout: SendPtr(self.into()),
            offset: 0,
            _phantom: PhantomData::default(),
        }
    }
}

impl<T: Coord + Send> Layout<T> {
    pub fn iter_par_nodes(
        &mut self,
        chunk_size: usize,
    ) -> impl Iterator<Item = impl ParallelIterator<Item = NodeParIter<T>>> {
        let ptr = SendPtr(self.into());
        let dimensions = self.settings.dimensions;
        let chunk_size_d = chunk_size * dimensions;
        let n = self.masses.len() * dimensions;
        (0..self.masses.len()).step_by(chunk_size).map(move |y0| {
            let y0_d = y0 * dimensions;
            (0..self.masses.len() - y0)
                .into_par_iter()
                .step_by(chunk_size)
                .map(move |x0| {
                    let x0_d = x0 * dimensions;
                    NodeParIter {
                        end: (x0_d + chunk_size_d).min(n),
                        ind: x0,
                        layout: ptr,
                        n2_start: x0_d + y0_d,
                        n2_start_ind: x0 + y0,
                        n2_end: (x0_d + y0_d + chunk_size_d).min(n),
                        offset: x0_d,
                        _phantom: PhantomData::default(),
                    }
                })
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use itertools::iproduct;
    use std::collections::BTreeSet;
    use std::sync::{Arc, RwLock};

    #[test]
    fn test_iter_nodes() {
        for n_nodes in 1usize..16 {
            let mut layout = Layout::<f32>::from_graph(
                vec![],
                Nodes::Degree(n_nodes),
                None,
                Settings::default(),
            );
            let mut hits = iproduct!(0..n_nodes, 0..n_nodes)
                .filter(|(n1, n2)| n1 < n2)
                .collect::<BTreeSet<(usize, usize)>>();
            let points = layout.points.clone();
            for n1 in layout.iter_nodes() {
                for n2 in n1.n2_iter {
                    assert!(hits.remove(&(n1.ind, n2.ind)));
                    assert_eq!(n1.pos, points.get(n1.ind));
                    assert_eq!(n2.pos, points.get(n2.ind));
                }
            }
            assert!(hits.is_empty());
        }
    }
}
