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

use forces::{Attraction, Repulsion, Gravity};

pub use layout::{Layout, LayoutType, DistanceThresholdMode, Settings};
pub use util::{Edge, Nodes, PointIter, PointIterMut, PointList, Position};

use itertools::izip;

impl<'a> Layout
where
    Layout: forces::Repulsion + forces::Attraction + forces::Gravity,
{
    /// Instanciates layout from an undirected graph, using initial positions
    ///
    /// Assumes edges `(n1, n2)` respect `n1 < n2`
    ///
    /// `nodes` is a list of coordinates, e.g. `[x1, y1, x2, y2, ...]`.
    pub fn from_position_graph(
        edges: Vec<Edge>,
        nodes: Nodes,
        positions: Vec<f32>,
        weights: Option<Vec<f32>>,
        settings: Settings,
    ) -> Self
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
                    .map(|degree| degree as f32)
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
                points: (0..nb).map(|_| 0.0).collect(),
            },
            old_speeds: PointList {
                dimensions: settings.dimensions,
                points: (0..nb).map(|_| 0.0).collect(),
            },
            weights,
            fn_attraction: Self::choose_attraction(&settings),
            fn_gravity: Self::choose_gravity(&settings),
            fn_repulsion: Self::choose_repulsion(&settings),
            settings,
        }
    }

    pub fn get_settings(&self) -> &Settings {
        &self.settings
    }

    /// Computes an iteration
    pub fn iteration(&mut self, i: usize) -> bool {
        self.init_iteration(i);
        self.apply_attraction();
        self.apply_repulsion();
        self.apply_gravity();

        let mut judging_distance = match self.settings.distance_threshold_mode {
            DistanceThresholdMode::Average => 0.0,
            DistanceThresholdMode::Max => f32::MIN,
            DistanceThresholdMode::Min => f32::MAX,
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
                self.apply_forces_fruchterman(interval.powi(i as i32), &mut update_judging_distance);
            },
            LayoutType::Force2 => self.apply_forces_force2(&mut update_judging_distance),
            LayoutType::ForceAtlas2 => self.apply_forces_forceatlas2(&mut update_judging_distance),
        };

        if let DistanceThresholdMode::Average = self.settings.distance_threshold_mode  {
            judging_distance = judging_distance / self.points.points.len() as f32;
        }

        judging_distance < self.settings.min_movement
    }

    fn init_iteration(&mut self, i: usize) {
        match self.settings.name {
            LayoutType::ForceAtlas2 => {
                for (speed, old_speed) in self
                    .speeds
                    .points
                    .iter_mut()
                    .zip(self.old_speeds.points.iter_mut())
                {
                    *old_speed = speed.clone();
                    *speed = 0.0;
                }
            },
            LayoutType::Force2 => {
                if i == 0 {
                    // Use as `velMap` in Force2.
                    for old_speed in self
                            .old_speeds
                            .points
                            .iter_mut()
                        {
                            *old_speed = 0.0;
                        }
                }
                for speed in self
                    .speeds
                    .points
                    .iter_mut()
                {
                    *speed = 0.0;
                }
            },
            _ => {
                for speed in self
                    .speeds
                    .points
                    .iter_mut()
                {
                    *speed = 0.0;
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

    fn apply_forces_force2(&mut self, update_judging_distance: &mut impl FnMut(f32)) {
        let damping = self.settings.damping;
        let interval = self.settings.interval;
        let max_speed = self.settings.max_speed;

        for (old_speed, speed) in izip!(
            self.old_speeds.iter_mut(),
            self.speeds.iter(),
        ) {
            let v_length = speed
                .iter()
                .zip(old_speed.iter_mut())
                .map(|(s, old_speed)| {
                    *old_speed = (*old_speed + *s * interval) * damping;
                    return (*old_speed).powi(2);
                })
                .sum::<f32>()
                .sqrt();
            if v_length > max_speed {
                let param2 = max_speed / v_length;
                old_speed.iter_mut()
                .for_each(|old_speed| {
                    *old_speed *= param2;
                });
            }
        }

        for (pos, old_speed) in izip!(
            self.points.iter_mut(),
            self.old_speeds.iter_mut(),
        ) {
            let mut distance = 0.0;
            pos.iter_mut()
                .zip(old_speed.iter())
                .for_each(|(pos, old_speed)| {
                    let d = *old_speed * interval;
                    distance += d * d;
                    *pos += d;
                });
            distance = distance.sqrt();

            update_judging_distance(distance);
        }
    }

    fn apply_forces_fruchterman(&mut self, i: f32, update_judging_distance: &mut impl FnMut(f32)) {
        let u_speed = self.settings.speed;
        let max_displace = u_speed * self.settings.damping * i;

        for (pos, speed) in izip!(
            self.points.iter_mut(),
            self.speeds.iter(),
        ) {
            let dist_length = speed
                .iter()
                .map(|s| (*s * u_speed).powi(2))
                .sum::<f32>()
                .sqrt();
            let limited_dist = if dist_length > max_displace { max_displace.clone() } else { dist_length.clone() };

            let mut distance = 0.0;
            pos.iter_mut()
                .zip(speed.iter())
                .for_each(|(pos, speed)| {
                    let d = *speed * u_speed / dist_length.clone() * limited_dist.clone();
                    distance += d * d;
                    *pos += d;
                });
            distance = distance.sqrt();

            update_judging_distance(distance);
        }
    }

    fn apply_forces_forceatlas2(&mut self, update_judging_distance: &mut impl FnMut(f32)) {
        for (pos, speed, old_speed) in izip!(
            self.points.iter_mut(),
            self.speeds.iter_mut(),
            self.old_speeds.iter()
        ) {
            let swinging = speed
                .iter()
                .zip(old_speed.iter())
                .map(|(s, old_s)| (*s - *old_s).powi(2))
                .sum::<f32>()
                .sqrt();
            let traction = speed
                .iter()
                .zip(old_speed.iter())
                .map(|(s, old_s)| (*s + *old_s).powi(2))
                .sum::<f32>()
                .sqrt();

            let f = traction.ln_1p() / (swinging.sqrt() + 1.0) * self.settings.speed;

            let mut distance = 0.0;
            pos.iter_mut()
                .zip(speed.iter())
                .for_each(|(pos, speed)| {
                    let d = *speed * f;
                    distance += d * d;
                    *pos += d;
                });
            distance = distance.sqrt();

            update_judging_distance(distance);
        }
    }
}
