use wasm_bindgen::prelude::*;

use crate::ForceGraphNode;

#[wasm_bindgen]
pub struct ForceGraphEdge {
    source: ForceGraphNode,
    target: ForceGraphNode,
    metadata: JsValue,
}

#[wasm_bindgen]
impl ForceGraphEdge {
    #[wasm_bindgen(method, getter)]
    pub fn source(&self) -> ForceGraphNode {
        self.source.to_owned()
    }

    #[wasm_bindgen(method, getter)]
    pub fn target(&self) -> ForceGraphNode {
        self.target.to_owned()
    }

    #[wasm_bindgen(method, getter)]
    pub fn metadata(&self) -> JsValue {
        self.metadata.to_owned()
    }
}

impl ForceGraphEdge {
    pub fn new(source: ForceGraphNode, target: ForceGraphNode, metadata: JsValue) -> Self {
        Self {
            source,
            target,
            metadata,
        }
    }
}