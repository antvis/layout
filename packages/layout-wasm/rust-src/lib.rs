use antv_layout::*;
use js_sys::Array;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

type T = f32;

/// Force layout. eg. ForceAtlas2, Force2...
#[derive(Serialize, Deserialize)]
pub struct ForceLayoutOptions {
    pub name: usize,
    pub nodes: usize,
    /// Assumes edges `(n1, n2)` respect `n1 < n2`
    pub edges: Vec<(usize, usize)>,
    /// A list of coordinates, e.g. `[x1, y1, x2, y2, ...]`.
    pub positions: Vec<T>,
    /// A list of masses, e.g. `[m1, m2, ...]`.
    pub masses: Vec<T>,
    /// A list of weights, e.g. `[e1, e2, ...]`.
    pub weights: Vec<T>,
    /// Iterations to execute.
    pub iterations: u32,
    /// ForceAtlas2. Attraction coefficient.
    pub ka: T,
    /// ForceAtlas2. Gravity coefficient.
    pub kg: T,
    /// ForceAtlas2. Repulsion coefficient.
    pub kr: T,
    pub speed: T,
    pub prevent_overlapping: bool,
    pub node_radius: T,
    pub kr_prime: T,
    pub strong_gravity: bool,
    pub lin_log: bool,
    pub dissuade_hubs: bool,
    /// Force2. The strength of edge force. Calculated according to the degree of nodes by default.
    pub edge_strength: T,
    /// Force2. The edge length.
    pub link_distance: T,
    pub node_strength: T,
    /// A parameter for repulsive force between nodes. Large the number, larger the repulsion.
    pub coulomb_dis_scale: T,
    /// Coefficient for the repulsive force. Larger the number, larger the repulsive force.
    pub factor: T,
    pub damping: T,
    pub interval: T,
    /// Fruchterman. The center of the graph.
    pub center: Vec<T>,
    pub max_speed: T,
    pub min_movement: T,
}

#[wasm_bindgen(js_name = "force")]
pub fn force(val: JsValue) -> Array {
    let options: ForceLayoutOptions = serde_wasm_bindgen::from_value(val).unwrap();

    let mut layout = Layout::<T>::from_position_graph(
        options.edges,
        Nodes::Mass(options.masses),
        options.positions,
        Some(options.weights),
        Settings {
            name: match options.name {
                0 => LayoutType::ForceAtlas2,
                1 => LayoutType::Force2,
                2 => LayoutType::Fruchterman,
                _ => panic!("Unknown layout type"),
            },
            chunk_size: Some(256),
            dimensions: 2,
            dissuade_hubs: options.dissuade_hubs,
            ka: options.ka,
            kg: options.kg,
            kr: options.kr,
            lin_log: options.lin_log,
            prevent_overlapping: if !options.prevent_overlapping {
                None
            } else {
                Some((options.node_radius, options.kr_prime))
            },
            speed: options.speed,
            strong_gravity: options.strong_gravity,
            edge_strength: options.edge_strength,
            link_distance: options.link_distance,
            node_strength: options.node_strength,
            coulomb_dis_scale: options.coulomb_dis_scale,
            factor: options.factor,
            damping: options.damping,
            interval: options.interval,
            center: options.center,
            max_speed: options.max_speed,
            min_movement: options.min_movement,
        },
    );

    for i in 0..options.iterations {
        layout.iteration(i as usize);
    }

    let nodes = Array::new();
    for pos in layout.points.iter() {
        nodes.push(&pos[0].into());
        nodes.push(&pos[1].into());
    }

    nodes
}
