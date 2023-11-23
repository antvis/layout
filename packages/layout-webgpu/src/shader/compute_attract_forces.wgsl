struct Node {
    value : f32,
    x : f32,
    y : f32,
    size : f32,
};
struct Nodes {
    nodes : array<Node>,
};
struct Edges {
    edges : array<u32>,
};
struct Forces {
    forces : array<f32>,
};
struct Uniforms {
    nodes_length : u32,
    edges_length : u32,
    cooling_factor : f32,
    ideal_length : f32,
};

@group(0) @binding(0) var<storage, read> nodes : Nodes;
@group(0) @binding(1) var<storage, read> edges : Edges;
@group(0) @binding(2) var<storage, read_write> forces : Forces;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    // let i : u32 = global_id.x;
    let l : f32 = uniforms.ideal_length;
    for (var i : u32 = 0u; i < uniforms.edges_length; i = i + 2u) {
        var a_force : vec2<f32> = vec2<f32>(0.0, 0.0);
        var node : Node = nodes.nodes[edges.edges[i]];
        var node2 : Node = nodes.nodes[edges.edges[i + 1u]];
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if(dist > 0.0) {
            var dir : vec2<f32> = normalize(vec2<f32>(node2.x, node2.y) - vec2<f32>(node.x, node.y));
            a_force = ((dist * dist) / l) * dir;
            forces.forces[edges.edges[i] * 2u] = forces.forces[edges.edges[i] * 2u] + a_force.x;
            forces.forces[edges.edges[i] * 2u + 1u] = forces.forces[edges.edges[i] * 2u + 1u] + a_force.y;
            forces.forces[edges.edges[i + 1u] * 2u] = forces.forces[edges.edges[i + 1u] * 2u] - a_force.x;
            forces.forces[edges.edges[i + 1u] * 2u + 1u] = forces.forces[edges.edges[i + 1u] * 2u + 1u] - a_force.y;
        }
    }
}