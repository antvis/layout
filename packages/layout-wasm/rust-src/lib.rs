use antv_layout::*;
use js_sys::Array;
use serde::{Serialize, Deserialize};
use wasm_bindgen::prelude::*;

#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

type T = f32;

#[derive(Serialize, Deserialize)]
pub struct ForceAtlas2Options {
    pub nodes: usize,
    pub edges: Vec<(usize, usize)>,
    pub iterations: u32,
    pub ka: f32,
    pub kg: f32,
    pub kr: f32,
    pub speed: f32,
    pub prevent_overlapping: bool,
    pub node_radius: f32,
    pub strong_gravity: bool,
    pub lin_log: bool,
}

#[wasm_bindgen(js_name = "forceAtlas2")]
pub fn force_atlas2(val: JsValue) -> Array {
    let options: ForceAtlas2Options = serde_wasm_bindgen::from_value(val).unwrap();

    let mut layout = Layout::<T>::from_graph(
        options.edges,
        Nodes::Degree(options.nodes),
        None,
        Settings {
            // barnes_hut: None,
            chunk_size: Some(256),
            dimensions: 2,
            dissuade_hubs: false,
            ka: options.ka,
            kg: options.kg,
            kr: options.kr,
            lin_log: options.lin_log,
            prevent_overlapping: if !options.prevent_overlapping { None } else { Some((options.node_radius, 100.0)) },
            speed: options.speed,
            strong_gravity: options.strong_gravity,
        },
    );

    for _i in 0..options.iterations {
        layout.iteration();
    }

    let nodes = Array::new();
    for pos in layout.points.iter() {
        nodes.push(&pos[0].into());
        nodes.push(&pos[1].into());
    }

    nodes

    // JsValue::from_serde(&layout.points).unwrap()
}