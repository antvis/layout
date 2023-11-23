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
    nodes_length : f32,
    edges_length : f32,
    cooling_factor : f32,
    ideal_length : f32,
};

@group(0) @binding(0) var<storage, read> nodes : Nodes;
@group(0) @binding(1) var<storage, read> adjmat : Edges;
@group(0) @binding(2) var<storage, read_write> forces : Forces;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;

fn get_bit_selector(bit_index : u32) -> u32 {
    return 1u << bit_index;
}

fn get_nth_bit(packed : u32, bit_index : u32) -> u32 {
    return packed & get_bit_selector(bit_index);
}

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let l : f32 = uniforms.ideal_length;
    let node : Node = nodes.nodes[global_id.x];
    var r_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    var a_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    for (var i : u32 = 0u; i < u32(uniforms.nodes_length); i = i + 1u) {
        if (i == global_id.x) {
            continue;
        }
        var node2 : Node = nodes.nodes[i];
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if (dist > 0.0){
            if (get_nth_bit(adjmat.edges[(i * u32(uniforms.nodes_length) + global_id.x) / 32u], (i * u32(uniforms.nodes_length) + global_id.x) % 32u) != 0u) {
                var dir : vec2<f32> = normalize(vec2<f32>(node2.x, node2.y) - vec2<f32>(node.x, node.y));
                a_force = a_force + ((dist * dist) / l) * dir;
            } else {
                var dir : vec2<f32> = normalize(vec2<f32>(node.x, node.y) - vec2<f32>(node2.x, node2.y));
                r_force = r_force + ((l * l) / dist) * dir;
            }
        }
    }
    var force : vec2<f32> = (a_force + r_force);
    var localForceMag: f32 = length(force); 
    if (localForceMag>0.000000001) {
        force = normalize(force) * min(uniforms.cooling_factor, length(force));
    }
    else{
        force.x = 0.0;
        force.y = 0.0;
    }
    forces.forces[global_id.x * 2u] = force.x;
    forces.forces[global_id.x * 2u + 1u] = force.y;
}