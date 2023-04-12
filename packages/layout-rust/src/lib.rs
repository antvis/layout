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

pub use layout::{Layout, Settings};
pub use util::{Coord, Edge, Nodes, PointIter, PointIterMut, PointList, Position};

use itertools::izip;
use num_traits::cast::NumCast;

impl<'a, T: Coord + std::fmt::Debug> Layout<T>
where
	Layout<T>: forces::Repulsion<T> + forces::Attraction<T>,
{
	/// Instantiates an empty layout
	pub fn empty(weighted: bool, settings: Settings<T>) -> Self {
		Self {
			edges: Vec::new(),
			points: PointList {
				dimensions: settings.dimensions,
				points: Vec::new(),
			},
			masses: Vec::new(),
			speeds: PointList {
				dimensions: settings.dimensions,
				points: Vec::new(),
			},
			old_speeds: PointList {
				dimensions: settings.dimensions,
				points: Vec::new(),
			},
			weights: if weighted { Some(Vec::new()) } else { None },
			fn_attraction: Self::choose_attraction(&settings),
			fn_gravity: forces::choose_gravity(&settings),
			fn_repulsion: Self::choose_repulsion(&settings),
			settings,
		}
	}

	/// Instanciates a randomly positioned layout from an undirected graph
	///
	/// Assumes edges `(n1, n2)` respect `n1 < n2`.
	#[cfg(feature = "rand")]
	pub fn from_graph(
		edges: Vec<Edge>,
		nodes: Nodes<T>,
		weights: Option<Vec<T>>,
		settings: Settings<T>,
	) -> Self
	where
		rand::distributions::Standard: rand::distributions::Distribution<T>,
		T: rand::distributions::uniform::SampleUniform,
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
		Self {
			edges,
			points: PointList {
				dimensions: settings.dimensions,
				points: {
					let mut rng = rand::thread_rng();
					(0..nodes.len())
						.flat_map(|_| util::sample_unit_ncube(&mut rng, settings.dimensions))
						.collect()
				},
			},
			masses: nodes,
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

	/// New node indices in arguments start at the current number of nodes
	pub fn add_nodes(
		&mut self,
		edges: &[Edge],
		nodes: Nodes<T>,
		positions: &[T],
		weights: Option<&[T]>,
	) {
		let new_nodes;
		match nodes {
			Nodes::Degree(nb_nodes) => {
				new_nodes = nb_nodes;
				self.masses.extend((0..nb_nodes).map(|_| T::zero()));
				for (n1, n2) in edges.iter() {
					self.masses[*n1] += T::one();
					self.masses[*n2] += T::one();
				}
			}
			Nodes::Mass(masses) => {
				new_nodes = masses.len();
				self.masses.extend_from_slice(&masses);
			}
		}
		assert_eq!(positions.len(), new_nodes * self.settings.dimensions);
		self.points.points.extend_from_slice(positions);
		self.speeds
			.points
			.extend((0..positions.len()).map(|_| T::zero()));
		self.old_speeds
			.points
			.extend((0..positions.len()).map(|_| T::zero()));
		self.edges.extend_from_slice(edges);
		match (weights, &mut self.weights) {
			(Some(new_weights), Some(weights)) => {
				assert_eq!(edges.len(), new_weights.len());
				weights.extend_from_slice(new_weights);
			}
			(None, None) => {}
			_ => panic!("Inconsistent weighting"),
		}
	}

	/// Remove edges by index
	pub fn remove_edge(&mut self, edge: usize) {
		self.edges.remove(edge);
		if let Some(weights) = &mut self.weights {
			weights.remove(edge);
		}
	}

	/// Remove a node by index
	///
	/// Assumes it has a null degree
	pub fn remove_node(&mut self, node: usize)
	where
		T: Copy,
	{
		self.points.remove(node);
		self.masses.remove(node);
		self.speeds.remove(node);
		self.old_speeds.remove(node);
	}

	/// Remove a node's incident edges
	pub fn remove_incident_edges(&mut self, node: usize) {
		self.edges.drain_filter(|(n1, n2)| {
			if *n1 == node || *n2 == node {
				true
			} else {
				if *n1 > node {
					*n1 -= 1;
				}
				if *n2 > node {
					*n2 -= 1;
				}
				false
			}
		});
	}

	/// Remove a node by index, automatically removing all its incident edges
	pub fn remove_node_with_edges(&mut self, node: usize)
	where
		T: Copy,
	{
		self.remove_incident_edges(node);
		self.remove_node(node);
	}

	/// Changes layout settings
	///
	/// # Panics
	/// Panics if `settings.dimensions` is changed.
	pub fn set_settings(&mut self, settings: Settings<T>) {
		assert_eq!(self.settings.dimensions, settings.dimensions);
		self.fn_attraction = Self::choose_attraction(&settings);
		self.fn_gravity = forces::choose_gravity(&settings);
		self.fn_repulsion = Self::choose_repulsion(&settings);
		self.settings = settings;
	}

	/// Computes an iteration of ForceAtlas2
	pub fn iteration(&mut self) {
		self.init_iteration();
		self.apply_attraction();
		self.apply_repulsion();
		self.apply_gravity();
		self.apply_forces();
	}

	fn init_iteration(&mut self) {
		for (speed, old_speed) in self
			.speeds
			.points
			.iter_mut()
			.zip(self.old_speeds.points.iter_mut())
		{
			*old_speed = speed.clone();
			*speed = T::zero();
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

	fn apply_forces(&mut self) {
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

#[cfg(test)]
mod tests {
	use super::*;

	use alloc_counter::{deny_alloc, AllocCounterSystem};

	#[global_allocator]
	static A: AllocCounterSystem = AllocCounterSystem;

	#[cfg(feature = "rand")]
	#[test]
	fn test_global() {
		let mut layout = Layout::<f64>::from_graph(
			vec![(0, 1), (0, 2), (0, 3), (1, 2), (1, 4)],
			Nodes::Degree(5),
			None,
			Settings::default(),
		);

		for _ in 0..10 {
			layout.iteration();
		}

		layout.points.iter().for_each(|pos| println!("{:?}", pos));
	}

	#[test]
	fn test_init_iteration() {
		let mut layout = Layout::<f64>::from_position_graph(
			vec![(0, 1)],
			Nodes::Degree(2),
			vec![-1.0, -1.0, 1.0, 1.0],
			None,
			Settings::default(),
		);
		layout
			.speeds
			.points
			.iter_mut()
			.enumerate()
			.for_each(|(i, s)| *s += i as f64);
		layout.init_iteration();
		assert_eq!(layout.speeds.points, vec![0.0, 0.0, 0.0, 0.0]);
	}

	#[test]
	fn test_forces() {
		let mut layout = Layout::<f64>::from_position_graph(
			vec![(0, 1)],
			Nodes::Degree(2),
			vec![-2.0, -2.0, 1.0, 2.0],
			None,
			Settings::default(),
		);

		layout.init_iteration();
		layout.apply_attraction();

		let speed_1 = dbg!(layout.speeds.get(0));
		let speed_2 = dbg!(layout.speeds.get(1));

		assert!(speed_1[0] > 0.0);
		assert!(speed_1[1] > 0.0);
		assert!(speed_2[0] < 0.0);
		assert!(speed_2[1] < 0.0);
		assert_eq!(speed_1[0], 3.0);
		assert_eq!(speed_1[1], 4.0);
		assert_eq!(speed_2[0], -3.0);
		assert_eq!(speed_2[1], -4.0);

		layout.init_iteration();
		layout.apply_repulsion();

		let speed_1 = dbg!(layout.speeds.get(0));
		let speed_2 = dbg!(layout.speeds.get(1));

		assert!(speed_1[0] < 0.0);
		assert!(speed_1[1] < 0.0);
		assert!(speed_2[0] > 0.0);
		assert!(speed_2[1] > 0.0);
		assert_eq!(speed_1[0], -0.48);
		assert_eq!(speed_1[1], -0.64);
		assert_eq!(speed_2[0], 0.48);
		assert_eq!(speed_2[1], 0.64);

		layout.init_iteration();
		layout.apply_gravity();

		let speed_1 = dbg!(layout.speeds.get(0));
		let speed_2 = dbg!(layout.speeds.get(1));

		assert!(speed_1[0] > 0.0);
		assert!(speed_1[1] > 0.0);
		assert!(speed_2[0] < 0.0);
		assert!(speed_2[1] < 0.0);
		assert_eq!(speed_1[0], 2.0 / 2.0.sqrt());
		assert_eq!(speed_1[1], 2.0 / 2.0.sqrt());
		assert_eq!(speed_2[0], -2.0 / 5.0.sqrt());
		assert_eq!(speed_2[1], -4.0 / 5.0.sqrt());
	}

	#[cfg(feature = "barnes_hut")]
	#[test]
	fn test_barnes_hut_2d() {
		let mut layout = Layout::<f64>::from_position_graph(
			vec![(0, 1)],
			Nodes::Degree(2),
			vec![-1.0, -1.0, 1.0, 1.0],
			None,
			Settings::default(),
		);

		layout.settings.barnes_hut = Some(0.5);
		layout.init_iteration();
		layout.apply_repulsion();

		let speed_1 = dbg!(layout.speeds.get(0));
		let speed_2 = dbg!(layout.speeds.get(1));

		assert!(speed_1[0] < 0.0);
		assert!(speed_1[1] < 0.0);
		assert!(speed_2[0] > 0.0);
		assert!(speed_2[1] > 0.0);
	}

	#[test]
	fn test_convergence() {
		let mut layout = Layout::<f64>::from_position_graph(
			vec![(0, 1), (1, 2)],
			Nodes::Degree(3),
			vec![-1.1, -1.0, 0.0, 0.0, 1.0, 1.0],
			None,
			Settings {
				#[cfg(feature = "parallel")]
				chunk_size: None,
				dimensions: 2,
				dissuade_hubs: false,
				ka: 0.5,
				kg: 0.01,
				kr: 0.01,
				lin_log: false,
				prevent_overlapping: None,
				speed: 1.0,
				strong_gravity: false,
				#[cfg(feature = "barnes_hut")]
				barnes_hut: None,
			},
		);

		for _ in 0..10 {
			println!("new iteration");
			layout.init_iteration();
			layout.apply_attraction();
			println!("{:?}", layout.speeds.points);
			layout.init_iteration();
			layout.apply_repulsion();
			println!("{:?}", layout.speeds.points);
			layout.init_iteration();
			layout.apply_gravity();
			println!("{:?}", layout.speeds.points);
			layout.apply_forces();
			//layout.iteration();

			dbg!(&layout.points.points);
			let point_1 = layout.points.get(0);
			let point_2 = layout.points.get(1);
			dbg!(((point_2[0] - point_1[0]).powi(2) + (point_2[1] - point_1[1]).powi(2)).sqrt());
		}
	}

	#[test]
	fn check_alloc() {
		let mut layout = Layout::<f64>::from_graph(
			vec![(0, 1), (0, 2), (0, 3), (1, 2), (1, 4), (3, 4)],
			Nodes::Degree(5),
			None,
			Settings::default(),
		);

		deny_alloc(|| layout.init_iteration());
		deny_alloc(|| layout.apply_attraction());
		deny_alloc(|| layout.apply_gravity());
		deny_alloc(|| layout.apply_forces());
	}
}
