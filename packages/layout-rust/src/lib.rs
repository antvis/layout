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

pub use layout::{Layout, LayoutType, DistanceThresholdMode, Settings};
pub use util::{Coord, Edge, Nodes, PointIter, PointIterMut, PointList, Position};

use itertools::izip;
use num_traits::{cast::NumCast, pow};

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
    pub fn iteration(&mut self, i: usize) -> bool {
        self.init_iteration();
        self.apply_attraction();
        self.apply_repulsion();
        self.apply_gravity();

        let mut judging_distance = match self.settings.distance_threshold_mode {
            DistanceThresholdMode::Average => T::zero(),
            DistanceThresholdMode::Max => T::from(f32::MIN).unwrap_or_else(T::zero),
            DistanceThresholdMode::Min => T::from(f32::MAX).unwrap_or_else(T::zero),
        };
        let distance_threshold_mode = self.settings.distance_threshold_mode.clone();

        let mut update_judging_distance = |distance| {
            match distance_threshold_mode {
                DistanceThresholdMode::Average => {
                    judging_distance += distance;
                },
                DistanceThresholdMode::Max => {
                    if distance > judging_distance {
                        judging_distance = distance;
                    }
                },
                DistanceThresholdMode::Min => {
                    if distance < judging_distance {
                        judging_distance = distance;
                    }
                },
            }
        };

        match self.settings.name {
            LayoutType::Fruchterman => {
                let interval = self.settings.interval.clone();
                self.apply_forces_fruchterman(pow(interval, i), &mut update_judging_distance);
            },
            LayoutType::Force2 => {
                let m1 = T::from(0.02).unwrap_or_else(T::one);
                let m2 = self.settings.interval.clone() - T::from(i).unwrap_or_else(T::one) * T::from(0.002).unwrap_or_else(T::one);
                let interval = if m1 > m2 { m1 } else { m2 };
                self.apply_forces_force2(interval, &mut update_judging_distance);
            },
            LayoutType::ForceAtlas2 => self.apply_forces_forceatlas2(&mut update_judging_distance),
        };

        if let DistanceThresholdMode::Average = self.settings.distance_threshold_mode  {
            judging_distance /= T::from(self.points.points.len() / self.points.dimensions).unwrap_or_else(T::one);
        }

        judging_distance < self.settings.min_movement
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
            _ => {
                for speed in self
                    .speeds
                    .points
                    .iter_mut()
                {
                    *speed = T::zero();
                }
            }
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

    fn apply_forces_force2(&mut self, interval: T, update_judging_distance: &mut impl FnMut(T)) {
        let damping = &self.settings.damping;
        let param = interval.clone() * damping.clone();
        let max_speed = self.settings.max_speed.clone();

        for (pos, speed) in izip!(
            self.points.iter_mut(),
            self.speeds.iter_mut(),
        ) {
            let dist_length = speed
                .iter()
                .map(|s| s.clone().pow_n(2u32))
                .sum::<T>()
                .sqrt() + T::from(0.0001).unwrap_or_else(T::zero);

            let mut distance = T::zero();    
            pos.iter_mut()
                .zip(speed.iter())
                .for_each(|(pos, speed)| {
                    let mut v = speed.clone() * param.clone();

                    if dist_length > max_speed {
                        v *= max_speed.clone() / dist_length.clone();
                    }

                    let d = v * interval.clone();
                    distance += d.clone() * d.clone();
                    *pos += d.clone();
                });
            distance = distance.sqrt();

            update_judging_distance(distance);
        }
    }

    fn apply_forces_fruchterman(&mut self, i: T, update_judging_distance: &mut impl FnMut(T)) {
        let u_speed = &self.settings.speed;
        let max_displace = u_speed.clone() * self.settings.damping.clone() * i.clone();

        for (pos, speed) in izip!(
            self.points.iter_mut(),
            self.speeds.iter(),
        ) {
            let dist_length = speed
                .iter()
                .map(|s| (s.clone() * u_speed.clone()).pow_n(2u32))
                .sum::<T>()
                .sqrt();
            let limited_dist = if dist_length > max_displace { max_displace.clone() } else { dist_length.clone() };

            let mut distance = T::zero();
            pos.iter_mut()
                .zip(speed.iter())
                .for_each(|(pos, speed)| {
                    let d = speed.clone() * u_speed.clone() / dist_length.clone() * limited_dist.clone();
                    distance += d.clone() * d.clone();
                    *pos += d.clone();
                });
            distance = distance.sqrt();

            update_judging_distance(distance);
        }
    }

    fn apply_forces_forceatlas2(&mut self, update_judging_distance: &mut impl FnMut(T)) {
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

            let mut distance = T::zero();
            pos.iter_mut()
                .zip(speed.iter())
                .for_each(|(pos, speed)| {
                    let d = speed.clone() * f.clone();
                    distance += d.clone() * d.clone();
                    *pos += d.clone();
                });
            distance = distance.sqrt();

            update_judging_distance(distance);
        }
    }
}
