use std::vec;

use antv_layout::*;
use js_sys::Array;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

/// Force layout. eg. ForceAtlas2, Force2...
#[derive(Serialize, Deserialize)]
pub struct ForceLayoutOptions {
    pub name: usize,
    pub dimensions: usize,
    /// A list of coordinates, e.g. `[x1, y1, x2, y2, ...]`.
    pub nodes: Vec<f32>,
    /// Assumes edges `(n1, n2)` respect `n1 < n2`
    pub edges: Vec<(usize, usize)>,
    /// A list of masses, e.g. `[m1, m2, ...]`.
    pub masses: Vec<f32>,
    /// A list of weights, e.g. `[e1, e2, ...]`.
    pub weights: Vec<f32>,
    /// Iterations to execute.
    pub iterations: u32,
    pub distance_threshold_mode: usize,
    pub min_movement: f32,
    /// ForceAtlas2. Attraction coefficient.
    pub ka: f32,
    /// ForceAtlas2. Gravity coefficient.
    pub kg: f32,
    /// ForceAtlas2. Repulsion coefficient.
    pub kr: f32,
    pub speed: f32,
    pub prevent_overlapping: bool,
    pub node_radius: f32,
    pub kr_prime: f32,
    pub strong_gravity: bool,
    pub lin_log: bool,
    pub dissuade_hubs: bool,
    /// Force2. The strength of edge force. Calculated according to the degree of nodes by default.
    pub edge_strength: f32,
    /// Force2. The edge length.
    pub link_distance: f32,
    pub node_strength: f32,
    /// A parameter for repulsive force between nodes. Large the number, larger the repulsion.
    pub coulomb_dis_scale: f32,
    /// Coefficient for the repulsive force. Larger the number, larger the repulsive force.
    pub factor: f32,
    pub damping: f32,
    pub interval: f32,
    /// Fruchterman. The center of the graph.
    pub center: Vec<f32>,
    pub max_speed: f32,
    pub chunk_size: usize,
    pub max_distance: f32,
}

#[wasm_bindgen(js_name = "force")]
pub fn force(val: JsValue) -> Array {
    let options: ForceLayoutOptions = serde_wasm_bindgen::from_value(val).unwrap();

    let mut layout = Layout::from_position_graph(
        options.edges,
        Nodes::Mass(options.masses),
        options.nodes,
        Some(options.weights),
        Settings {
            name: match options.name {
                0 => LayoutType::ForceAtlas2,
                1 => LayoutType::Force2,
                2 => LayoutType::Fruchterman,
                _ => panic!("Unknown layout type"),
            },
            chunk_size: Some(options.chunk_size),
            dimensions: options.dimensions,
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
            distance_threshold_mode: match options.distance_threshold_mode {
                0 => DistanceThresholdMode::Average,
                1 => DistanceThresholdMode::Min,
                2 => DistanceThresholdMode::Max,
                _ => panic!("Unknown layout type"),
            },
            max_distance: options.max_distance,
        },
    );

    for i in 0..options.iterations {
        if layout.iteration(i as usize) {
            // Break early if layout is convergent.
            break;
        }
    }

    let nodes = Array::new();
    for pos in layout.points.iter() {
        nodes.push(&pos[0].into());
        nodes.push(&pos[1].into());
        if options.dimensions == 3 {
            nodes.push(&pos[2].into());
        }
    }

    nodes
}

#[derive(Serialize, Deserialize)]
pub struct GraphNodeResult {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Serialize, Deserialize)]
pub struct GraphEdgeResult {
    pub x: f32,
    pub y: f32,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub points: Vec<f32>,
}

#[derive(Serialize, Deserialize)]
pub struct DagreResult {
    nodes: Vec<GraphNodeResult>,
    edges: Vec<GraphEdgeResult>,
}

#[derive(Serialize, Deserialize)]
pub struct DagreLayoutOptions {
    /// A list of coordinates, e.g. `[width, height, width, height, ...]`.
    pub nodes: Vec<f32>,
    /// Assumes edges `(n1, n2)` respect `n1 < n2`
    pub edges: Vec<(usize, usize)>,
    /// A list of masses, e.g. `[m1, m2, ...]`.
    pub masses: Vec<f32>,
    /// A list of weights, e.g. `[e1, e2, ...]`.
    pub weights: Vec<f32>,

    pub nodesep: Option<f32>,    // default 50
    pub edgesep: Option<f32>,    // default 20
    pub ranksep: Option<f32>,    // default 50
    pub marginx: Option<f32>,    // default 0
    pub marginy: Option<f32>,    // default 0
    pub rankdir: Option<String>, // lr, lr, tb, bt // default tb
    pub align: Option<String>,   // UL, UR, DL, DR // default UL
}

#[wasm_bindgen(js_name = "dagre")]
pub fn dagre(val: JsValue) -> JsValue {
    let options: DagreLayoutOptions = serde_wasm_bindgen::from_value(val).unwrap();

    let mut graph: Graph<GraphConfig, GraphNode, GraphEdge> = Graph::new(Some(GraphOption {
        directed: Some(true),
        multigraph: Some(false),
        compound: Some(false),
    }));
    // let mut default_graph_config = GraphConfig::default();
    // default_graph_config.width = 500.0;
    // default_graph_config.height = 500.0;
    // graph.set_graph(default_graph_config);

    graph.set_graph(GraphConfig {
        nodesep: options.nodesep,
        edgesep: options.edgesep,
        ranksep: options.ranksep,
        marginx: options.marginx,
        marginy: options.marginy,
        rankdir: options.rankdir,
        align: options.align,
        ..GraphConfig::default()
    });

    for (i, n) in options.nodes.iter().step_by(2).enumerate() {
        graph.set_node(
            i.to_string(),
            Some(GraphNode {
                // width: options.nodes[i * 2],
                // height: options.nodes[i * 2 + 1],
                width: 10.0,
                height: 10.0,
                ..Default::default()
            }),
        );
    }

    for (i, e) in options.edges.iter().enumerate() {
        graph.set_edge(
            &e.1.to_string(),
            &e.0.to_string(),
            Some(GraphEdge {
                weight: Some(options.weights[i]),
                ..Default::default()
            }),
            None,
        );
    }

    layout(&mut graph);

    let mut nodes = Vec::new();
    for v in graph.nodes() {
        let layout_label = graph.node(&v).unwrap();
        let result = GraphNodeResult {
            x: layout_label.x,
            y: layout_label.y,
            width: layout_label.width,
            height: layout_label.height,
        };
        nodes.push(result);
    }

    let mut edges = Vec::new();
    for e in graph.edges() {
        let layout_label = graph.edge(&e.v, &e.w, e.name).unwrap();

        let mut pts = Vec::new();
        let mut points = layout_label.points.clone().unwrap_or(vec![]);
        points.iter_mut().for_each(|point| {
            pts.push(point.x);
            pts.push(point.y);
        });
        let result = GraphEdgeResult {
            x: layout_label.x,
            y: layout_label.y,
            width: layout_label.width,
            height: layout_label.height,
            points: pts,
        };
        edges.push(result);
    }

    serde_wasm_bindgen::to_value(&DagreResult { nodes, edges }).unwrap()
}
