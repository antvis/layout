struct Edges {
    edges : array<u32>,
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

@group(0) @binding(0) var<storage, read> edges : Edges;
@group(0) @binding(1) var<storage, read_write> edge_info : EdgeInfoArray;
@group(0) @binding(2) var<storage, read_write> dest_list : UintArray;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    var counter : u32 = 0u;
    var dest : u32 = 0u;
    // expects edges to be sorted by dest id
    for (var i : u32 = 0u; i < u32(uniforms.edges_length); i = i + 2u) {
        var source : u32 = edges.edges[i];
        var new_dest : u32 = edges.edges[i + 1u];
        edge_info.a[new_dest].dest_degree = edge_info.a[new_dest].dest_degree + 1u;
        dest_list.a[counter] = source;
        if (new_dest != dest || i == 0u) {
            edge_info.a[new_dest].dest_start = counter;
        }
        counter = counter + 1u;
        dest = new_dest;
    }
}