use glam::Vec3;
use petgraph::{EdgeType, Undirected};

use crate::ForceGraph;
use std::ops::RangeInclusive;

mod fruchterman_reingold;
mod handy;

pub use {
    fruchterman_reingold::{fruchterman_reingold, fruchterman_reingold_weighted},
    handy::handy,
    hashlink::LinkedHashMap,
};

/// A value that you can change in a [`Force`]'s dictionary.
#[derive(Clone, Debug, PartialEq)]
pub enum Value {
    Number(f32, RangeInclusive<f32>),
    Bool(bool),
}

impl Value {
    /// Retrieves the bool from a value.
    pub const fn bool(&self) -> Option<bool> {
        match self {
            Self::Bool(b) => Some(*b),
            _ => None,
        }
    }

    /// Same as bool but returns a mutable version.
    pub fn bool_mut(&mut self) -> Option<&mut bool> {
        match self {
            Self::Bool(b) => Some(b),
            _ => None,
        }
    }

    /// Retrieves the number from a value. If you mess up and call it on a bool it will return 0.0.
    pub const fn number(&self) -> Option<f32> {
        match self {
            Self::Number(n, _) => Some(*n),
            _ => None,
        }
    }

    /// Same as number but returns a mutable version.
    pub fn number_mut(&mut self) -> Option<&mut f32> {
        match self {
            Self::Number(n, _) => Some(n),
            _ => None,
        }
    }
}

/// A struct that defines how your force behaves.
#[derive(Clone)]
pub struct Force<N, E, Ty = Undirected> {
    /// Current dictionary
    pub dict: LinkedHashMap<String, Value>,
    /// Default dictionary
    pub dict_default: LinkedHashMap<String, Value>,
    /// Name of the force
    pub name: &'static str,
    /// Whether or not the force should be run on each frame.
    pub continuous: bool,
    /// A short description of the force.
    pub info: Option<&'static str>,
    /// Force callback function.
    pub update: fn(dict: &LinkedHashMap<String, Value>, graph: &mut ForceGraph<N, E, Ty>, dt: f32),
}

impl<N, E, Ty> Force<N, E, Ty> {
    /// Retrieve the name of the force.
    pub fn name(&self) -> &'static str {
        self.name
    }

    /// Retrieve the force's information.
    pub fn info(&self) -> Option<&'static str> {
        self.info
    }

    /// Update the graph's node's positions for a given interval.
    pub fn update(&self, graph: &mut ForceGraph<N, E, Ty>, dt: f32) {
        (self.update)(&self.dict, graph, dt);
    }

    /// Retrieve a mutable reference to the force's internal dictionary.
    pub fn dict_mut(&mut self) -> &mut LinkedHashMap<String, Value> {
        &mut self.dict
    }

    /// Retrieve a reference to the force's internal dictionary.
    pub fn dict(&self) -> &LinkedHashMap<String, Value> {
        &self.dict
    }

    /// Reset the force's internal dictionary.
    pub fn reset(&mut self) {
        self.dict = self.dict_default.clone();
    }

    /// Retrieve if the force is continuous.
    /// Continuous forces run their update on every frame, non-continuous forces run their update every time the user clicks a "Run" button.
    pub fn continuous(&self) -> bool {
        self.continuous
    }
}

impl<N, E, Ty> PartialEq for Force<N, E, Ty> {
    fn eq(&self, other: &Self) -> bool {
        self.dict_default == other.dict_default
            && self.name == other.name
            && self.continuous == other.continuous
            && self.info == other.info
    }
}

/// A force for scaling the layout around its center.
pub fn scale<N, E, Ty: EdgeType>() -> Force<N, E, Ty> {
    fn update<N, E, Ty: EdgeType>(
        dict: &LinkedHashMap<String, Value>,
        graph: &mut ForceGraph<N, E, Ty>,
        _dt: f32,
    ) {
        let scale = dict.get("Scale Factor").unwrap().number().unwrap();

        let center = Iterator::sum::<Vec3>(
            graph
                .node_weights()
                .map(|x| x.location)
                .collect::<Vec<Vec3>>()
                .iter(),
        ) / graph.node_count() as f32;

        for node in graph.node_weights_mut() {
            node.location = ((node.location - center) * scale) + center;
        }
    }

    let mut dict = LinkedHashMap::new();
    dict.insert("Scale Factor".to_string(), Value::Number(1.5, 0.1..=2.0));

    Force {
        dict: dict.clone(),
        dict_default: dict,
        name: "Scale",
        continuous: false,
        info: Some("Scales the graph around its center."),
        update,
    }
}

/// A force for translating the graph in any direction.
pub fn translate<N, E, Ty: EdgeType>() -> Force<N, E, Ty> {
    fn update<N, E, Ty: EdgeType>(
        dict: &LinkedHashMap<String, Value>,
        graph: &mut ForceGraph<N, E, Ty>,
        _dt: f32,
    ) {
        let distance = dict.get("Distance").unwrap().number().unwrap();

        for node in graph.node_weights_mut() {
            if dict.get("Up").unwrap().bool().unwrap() {
                node.location.y -= distance;
            }

            if dict.get("Down").unwrap().bool().unwrap() {
                node.location.y += distance;
            }

            if dict.get("Left").unwrap().bool().unwrap() {
                node.location.x -= distance;
            }

            if dict.get("Right").unwrap().bool().unwrap() {
                node.location.x += distance;
            }
        }
    }

    let mut dict = LinkedHashMap::new();
    dict.insert("Distance".to_string(), Value::Number(7.0, 0.0..=100.0));
    dict.insert("Up".to_string(), Value::Bool(false));
    dict.insert("Down".to_string(), Value::Bool(false));
    dict.insert("Left".to_string(), Value::Bool(false));
    dict.insert("Right".to_string(), Value::Bool(false));

    Force {
        dict: dict.clone(),
        dict_default: dict,
        name: "Translate",
        continuous: false,
        info: Some("Moves the entire layout in any direction."),
        update,
    }
}

#[doc(hidden)]
pub fn unit_vector(a: Vec3, b: Vec3) -> Vec3 {
    (b - a) / a.distance(b)
}