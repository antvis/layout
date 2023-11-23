struct Node {
    value : f32,
    x : f32,
    y : f32,
    size : f32,
};
struct Nodes {
    nodes : array<Node>,
};
struct Forces {
    forces : array<f32>,
};
struct UintArray {
    a : array<u32>,
};
struct EdgeInfo {
    source_start : u32,
    source_degree : u32,
    dest_start : u32,
    dest_degree : u32,
}
struct EdgeInfoArray {
    a : array<EdgeInfo>,
};
struct Uniforms {
    nodes_length : f32,
    edges_length : f32,
    cooling_factor : f32,
    ideal_length : f32,
};

@group(0) @binding(0) var<storage, read_write> edge_info : EdgeInfoArray;
@group(0) @binding(1) var<storage, read> source_list : UintArray;
@group(0) @binding(2) var<storage, read> dest_list : UintArray;
@group(0) @binding(3) var<storage, read_write> forces : Forces;
@group(0) @binding(4) var<storage, read> nodes : Nodes;
@group(0) @binding(5) var<uniform> uniforms : Uniforms;

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let l : f32 = uniforms.ideal_length;
    var node : Node = nodes.nodes[global_id.x];
    var a_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    var info : EdgeInfo = edge_info.a[global_id.x];
    // Accumulate forces where node is the source
    for (var i : u32 = info.source_start; i < info.source_start + info.source_degree; i = i + 1u) {
        var node2 : Node = nodes.nodes[source_list.a[i]];
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if(dist > 0.0000001) {
            var dir : vec2<f32> = normalize(vec2<f32>(node2.x, node2.y) - vec2<f32>(node.x, node.y));
            a_force = a_force + ((dist * dist) / l) * dir;
        }
    }
    // Accumulate forces where node is the dest
    for (var i : u32 = info.dest_start; i < info.dest_start + info.dest_degree; i = i + 1u) {
        var node2 : Node = nodes.nodes[dest_list.a[i]];
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if(dist > 0.0000001) {
            var dir : vec2<f32> = normalize(vec2<f32>(node2.x, node2.y) - vec2<f32>(node.x, node.y));
            a_force = a_force + ((dist * dist) / l) * dir;
        }
    }
    forces.forces[global_id.x * 2u] = a_force.x;
    forces.forces[global_id.x * 2u + 1u] = a_force.y;
}