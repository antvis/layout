#![feature(drain_filter)]
#![feature(specialization)]
#![feature(stdsimd)]
#![feature(trait_alias)]
#![allow(incomplete_features)]
#![feature(core_intrinsics)]

mod forces;
mod iter;
mod layout;
mod util;

use forces::{Attraction, Repulsion};

pub use layout::{Layout, LayoutType, Settings};
pub use util::{Coord, Edge, Nodes, PointIter, PointIterMut, PointList, Position};

use itertools::izip;
use num_traits::cast::NumCast;

impl<'a, T: Coord + std::fmt::Debug> Layout<T>
where
    Layout<T>: forces::Repulsion<T> + forces::Attraction<T>,
{
    /// Instanciates layout from an undirected graph, using initial positions
    ///
    /// Assumes edges `(n1, n2)` respect `n1 < n2`
    ///
    /// `nodes` is a list of coordinates, e.g. `[x1, y1, x2, y2, ...]`.
    pub fn from_position_graph(
        edges: Vec<Edge>,
        nodes: Nodes<T>,
        positions: Vec<T>,
        weights: Option<Vec<T>>,
        settings: Settings<T>,
    ) -> Self
    where
        T: 'a,
    {
        if let Some(weights) = &weights {
            assert_eq!(weights.len(), edges.len());
        }

        let nodes = match nodes {
            Nodes::Degree(nb_nodes) => {
                let mut degrees: Vec<usize> = vec![0; nb_nodes];
                for (n1, n2) in edges.iter() {
                    *degrees.get_mut(*n1).unwrap() += 1;
                    *degrees.get_mut(*n2).unwrap() += 1;
                }
                degrees
                    .into_iter()
                    .map(|degree| <T as NumCast>::from(degree).unwrap())
                    .collect()
            }
            Nodes::Mass(masses) => masses,
        };

        let nb = nodes.len() * settings.dimensions;
        assert_eq!(positions.len(), nb);
        Self {
            edges,
            masses: nodes,
            points: PointList {
                dimensions: settings.dimensions,
                points: positions,
            },
            speeds: PointList {
                dimensions: settings.dimensions,
                points: (0..nb).map(|_| T::zero()).collect(),
            },
            old_speeds: PointList {
                dimensions: settings.dimensions,
                points: (0..nb).map(|_| T::zero()).collect(),
            },
            weights,
            fn_attraction: Self::choose_attraction(&settings),
            fn_gravity: forces::choose_gravity(&settings),
            fn_repulsion: Self::choose_repulsion(&settings),
            settings,
        }
    }

    pub fn get_settings(&self) -> &Settings<T> {
        &self.settings
    }

    /// Computes an iteration
    pub fn iteration(&mut self) {
        self.init_iteration();
        self.apply_attraction();
        self.apply_repulsion();
        self.apply_gravity();

        match self.settings.name {
            LayoutType::Fruchterman => self.apply_forces_fruchterman(),
            LayoutType::Force2 => self.apply_forces_force2(),
            LayoutType::ForceAtlas2 => self.apply_forces_forceatlas2(),
        }
    }

    fn init_iteration(&mut self) {
        match self.settings.name {
            LayoutType::ForceAtlas2 => {
                for (speed, old_speed) in self
                    .speeds
                    .points
                    .iter_mut()
                    .zip(self.old_speeds.points.iter_mut())
                {
                    *old_speed = speed.clone();
                    *speed = T::zero();
                }
            },
            LayoutType::Fruchterman => {}
            LayoutType::Force2 => {}
        }
    }

    fn apply_attraction(&mut self) {
        (self.fn_attraction)(self)
    }

    fn apply_gravity(&mut self) {
        (self.fn_gravity)(self)
    }

    fn apply_repulsion(&mut self) {
        (self.fn_repulsion)(self)
    }

    fn apply_forces_force2(&mut self) {
        let interval = self.settings.interval.clone();

        // for (pos, speed) in izip!(
        //     self.points.iter_mut(),
        //     self.speeds.iter_mut(),
        // ) {
        //     let dist_length = speed
        //         .iter()
        //         .map(|s| s.clone().pow_n(2u32))
        //         .sum::<T>()
        //         .sqrt();
        //     if dist_length > T::zero() {
        //         let limited_dist = if dist_length > max_displace { max_displace.clone() } else { dist_length.clone() };
        //         pos.iter_mut()
        //             .zip(speed.iter_mut())
        //             .for_each(|(pos, speed)| {
        //                 *pos += speed.clone() / dist_length.clone() * limited_dist.clone();
        //             });
        //     }
        // }
    }

    fn apply_forces_fruchterman(&mut self) {
        let max_displace = self.settings.speed.clone() * self.settings.damping.clone();

        for (pos, speed) in izip!(
            self.points.iter_mut(),
            self.speeds.iter_mut(),
        ) {
            let dist_length = speed
                .iter()
                .map(|s| s.clone().pow_n(2u32))
                .sum::<T>()
                .sqrt();
            if dist_length > T::zero() {
                let limited_dist = if dist_length > max_displace { max_displace.clone() } else { dist_length.clone() };
                pos.iter_mut()
                    .zip(speed.iter_mut())
                    .for_each(|(pos, speed)| {
                        *pos += speed.clone() / dist_length.clone() * limited_dist.clone();
                    });
            }
        }
    }

    fn apply_forces_forceatlas2(&mut self) {
        for (pos, speed, old_speed) in izip!(
            self.points.iter_mut(),
            self.speeds.iter_mut(),
            self.old_speeds.iter()
        ) {
            let swinging = speed
                .iter()
                .zip(old_speed.iter())
                .map(|(s, old_s)| (s.clone() - old_s.clone()).pow_n(2u32))
                .sum::<T>()
                .sqrt();
            let traction = speed
                .iter()
                .zip(old_speed.iter())
                .map(|(s, old_s)| (s.clone() + old_s.clone()).pow_n(2u32))
                .sum::<T>()
                .sqrt();

            let f = traction.ln_1p() / (swinging.sqrt() + T::one()) * self.settings.speed.clone();

            pos.iter_mut()
                .zip(speed.iter_mut())
                .for_each(|(pos, speed)| {
                    *pos += speed.clone() * f.clone();
                });
        }
    }
}
