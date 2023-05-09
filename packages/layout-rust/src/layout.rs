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
pub enum DistanceThresholdMode {
    /// Use the average distance between nodes
    Average,
    /// Use the maximum distance between nodes
    Max,
    /// Use the minimum distance between nodes
    Min,
}

#[derive(Clone)]
pub struct Settings {
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
    pub ka: f32,
    /// Gravity coefficient
    pub kg: f32,
    /// Repulsion coefficient
    pub kr: f32,
    /// Logarithmic attraction
    pub lin_log: bool,
    /// Prevent node overlapping for a prettier graph (node_size, kr_prime).
    ///
    /// `node_size` is the radius around a node where the repulsion coefficient is `kr_prime`.
    /// `kr_prime` is arbitrarily set to `100.0` in Gephi implementation.
    pub prevent_overlapping: Option<(f32, f32)>,
    /// Speed factor
    pub speed: f32,
    /// Gravity does not decrease with distance, resulting in a more compact graph.
    pub strong_gravity: bool,

    /// Used in Force2 layout.
    pub link_distance: f32,
    /// The strength of edge force. Calculated according to the degree of nodes by default
    pub edge_strength: f32,
    /// The strength of node force. Positive value means repulsive force, negative value means attractive force (it is different from 'force')
    pub node_strength: f32,
    /// A parameter for repulsive force between nodes. Large the number, larger the repulsion.
    pub coulomb_dis_scale: f32,
    /// Coefficient for the repulsive force. Larger the number, larger the repulsive force.
    pub factor: f32,
    pub damping: f32,
    pub interval: f32,
    pub max_speed: f32,
    pub min_movement: f32,
    pub distance_threshold_mode: DistanceThresholdMode,
    pub max_distance: f32,

    /// Used in Fruchterman layout.
    pub center: Vec<f32>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            chunk_size: Some(256),
            dimensions: 2,
            dissuade_hubs: false,
            ka: 1.0,
            kg: 1.0,
            kr: 1.0,
            lin_log: false,
            prevent_overlapping: None,
            speed: 0.01,
            strong_gravity: false,
            name: LayoutType::ForceAtlas2,
            link_distance: 1.0,
            edge_strength: 1.0,
            node_strength: 1.0,
            coulomb_dis_scale: 1.0,
            factor: 1.0,
            damping: 1.0,
            interval: 1.0,
            center: vec![0.0; 2],
            max_speed: 1.0,
            min_movement: 0.0,
            distance_threshold_mode: DistanceThresholdMode::Average,
            max_distance: 100.0,
        }
    }
}

pub struct Layout {
    pub edges: Vec<Edge>,
    pub masses: Vec<f32>,
    /// List of the nodes' positions
    pub points: PointList,
    pub(crate) settings: Settings,
    pub speeds: PointList,
    pub old_speeds: PointList,
    pub weights: Option<Vec<f32>>,

    pub(crate) fn_attraction: fn(&mut Self),
    pub(crate) fn_gravity: fn(&mut Self),
    pub(crate) fn_repulsion: fn(&mut Self),
}

impl Layout {
    pub fn iter_nodes(&mut self) -> NodeIter {
        NodeIter {
            ind: 0,
            layout: SendPtr(self.into()),
            offset: 0,
            _phantom: PhantomData::default(),
        }
    }
}

impl Layout {
    pub fn iter_par_nodes(
        &mut self,
        chunk_size: usize,
    ) -> impl Iterator<Item = impl ParallelIterator<Item = NodeParIter>> {
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
