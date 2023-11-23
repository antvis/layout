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
// struct Batch {
//     batch_id : u32,
// };
struct Uniforms {
    nodes_length : f32,
    edges_length : f32,
    cooling_factor : f32,
    ideal_length : f32,
};
struct Range {
    x_min : atomic<i32>,
    x_max : atomic<i32>,
    y_min : atomic<i32>,
    y_max : atomic<i32>,
};
@group(0) @binding(0) var<storage, read_write> nodes : Nodes;
@group(0) @binding(1) var<storage, read_write> forces : Forces;
// @group(0) @binding(2) var<uniform> batch : Batch;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;
@group(0) @binding(3) var<storage, read_write> bounding : Range;

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    var high : f32 = 8.0;
    var low : f32 = -7.0;
    var batch_index : u32 = global_id.x;
    for (var iter = 0u; iter < 2u; iter = iter + 1u) {
        // nodes.nodes[batch_index].x = nodes.nodes[batch_index].x + forces.forces[batch_index * 2u];
        // nodes.nodes[batch_index].y = nodes.nodes[batch_index].y + forces.forces[batch_index * 2u + 1u]; 
        if (forces.forces[batch_index * 2u] > uniforms.cooling_factor) {
            // atomicStore(&bounding.y_max, i32(batch_index));
            forces.forces[batch_index * 2u] = 0.0;    
        }
        if (forces.forces[batch_index * 2u + 1u] > uniforms.cooling_factor) {
            // atomicStore(&bounding.y_min, i32(batch_index));
            forces.forces[batch_index * 2u + 1u] = 0.0;    
        }
        var x : f32 = min(high, max(low, nodes.nodes[batch_index].x + forces.forces[batch_index * 2u]));
        var y : f32 = min(high, max(low, nodes.nodes[batch_index].y + forces.forces[batch_index * 2u + 1u]));

        // var centering : vec2<f32> = normalize(vec2<f32>(0.5, 0.5) - vec2<f32>(x, y));
        // var dist : f32 = distance(vec2<f32>(0.5, 0.5), vec2<f32>(x, y));
        // x = x + centering.x * (0.1 * uniforms.cooling_factor * dist);
        // y = y + centering.y * (0.1 * uniforms.cooling_factor * dist);
        // Randomize position slightly to prevent exact duplicates after clamping
        if (x == high) {
            x = x - f32(batch_index) / 500000.0; 
        } 
        if (y == high) {
            y = y - f32(batch_index) / 500000.0; 
        }
        if (x == low) {
            x = x + f32(batch_index) / 500000.0; 
        }
        if (y == low) {
            y = y + f32(batch_index) / 500000.0; 
        }
        nodes.nodes[batch_index].x = x;
        nodes.nodes[batch_index].y = y;
        forces.forces[batch_index * 2u] = 0.0;
        forces.forces[batch_index * 2u + 1u] = 0.0;
        atomicMin(&bounding.x_min, i32(floor(x * 1000.0)));
        atomicMax(&bounding.x_max, i32(floor(x * 1000.0)));
        atomicMin(&bounding.y_min, i32(floor(y * 1000.0)));
        atomicMax(&bounding.y_max, i32(floor(y * 1000.0)));


        // var test : f32 = forces.forces[0]; 
        // var test2 : f32 = nodes.nodes[0].x;
        batch_index = batch_index + (u32(uniforms.nodes_length) / 2u);
    }
}