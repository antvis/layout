struct Node {
    value : f32,
    x : f32,
    y : f32,
    size : f32,
};
struct Nodes {
    nodes : array<Node>,
};
struct Rectangle {
    x : f32,
    y : f32,
    w : f32,
    h : f32,
};
struct QuadTree {
    boundary : Rectangle,
    // In order NW; NE; SW; SE
    pointers : vec4<f32>,
    CoM : vec2<f32>,
    mass : f32,
    test : f32,
};
struct Uniforms {
    nodes_length : f32,
    edges_length : f32,
    cooling_factor : f32,
    ideal_length : f32,
};
struct QuadTrees {
    quads : array<QuadTree>,
}
struct Range {
    x_min : i32,
    x_max : i32,
    y_min : i32,
    y_max : i32,
};

@group(0) @binding(0) var<storage, read> nodes : Nodes;
@group(0) @binding(1) var<storage, read_write> quads : QuadTrees;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;
@group(0) @binding(3) var<storage, read_write> bounding : Range;

@compute @workgroup_size(1)
fn main() {
    let x_min : f32 = f32(bounding.x_min) / 1000.0;
    let y_min : f32 = f32(bounding.y_min) / 1000.0;
    let width : f32 = f32(bounding.x_max - bounding.x_min) / 1000.0;
    let height : f32 = f32(bounding.y_max - bounding.y_min) / 1000.0;
    quads.quads[0] = QuadTree(
        Rectangle(x_min, y_min, width, height),
        // Can use 0 as null pointer for indexing because 0 is always root
        vec4<f32>(0.0, 0.0, 0.0, 0.0),
        vec2<f32>(-1.0, -1.0),
        0.0, 0.0
    );
    var counter : u32 = 1u;
    for (var i : u32 = 0u; i < u32(uniforms.nodes_length); i = i + 1u) {
        var index : u32 = 0u;
        loop {
            // We have null cell so create body
            if (quads.quads[index].mass < 1.0) {
                quads.quads[index].mass = 1.0;
                quads.quads[index].CoM = vec2<f32>(nodes.nodes[i].x, nodes.nodes[i].y);
                break;
            }
            // Found a cell or body
            let boundary : Rectangle = quads.quads[index].boundary;
            // Found body, need to partition
            if (quads.quads[index].mass < 2.0) {
                quads.quads[index].pointers.x = f32(counter);                                   
                quads.quads[counter] = QuadTree(
                    Rectangle(boundary.x, boundary.y + boundary.h / 2.0, boundary.w / 2.0, boundary.h / 2.0),
                    vec4<f32>(0.0, 0.0, 0.0, 0.0),
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                quads.quads[index].pointers.y = f32(counter + 1u);      
                quads.quads[counter + 1u] = QuadTree(
                    Rectangle(boundary.x + boundary.w / 2.0, boundary.y + boundary.h / 2.0, boundary.w / 2.0, boundary.h / 2.0),
                    vec4<f32>(0.0, 0.0, 0.0, 0.0),
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                quads.quads[index].pointers.z = f32(counter + 2u);                                   
                quads.quads[counter + 2u] = QuadTree(
                    Rectangle(boundary.x, boundary.y, boundary.w / 2.0, boundary.h / 2.0),
                    vec4<f32>(0.0, 0.0, 0.0, 0.0),
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                quads.quads[index].pointers.w = f32(counter + 3u);               
                quads.quads[counter + 3u] = QuadTree(
                    Rectangle(boundary.x + boundary.w / 2.0, boundary.y, boundary.w / 2.0, boundary.h / 2.0),
                    vec4<f32>(0.0, 0.0, 0.0, 0.0),
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                counter = counter + 4u;
                // if (any(quads.quads[index].CoM == vec2<f32>(nodes.nodes[i].x, nodes.nodes[i].y))) {
                //     quads.quads[index].CoM = quads.quads[index].CoM + vec2<f32>(0.001, 0.001);
                // }
                let x : f32 = quads.quads[index].CoM.x;
                let y : f32 = quads.quads[index].CoM.y;
                if (x <= boundary.x + boundary.w / 2.0) {
                    if (y <= boundary.y + boundary.h / 2.0) {
                        quads.quads[u32(quads.quads[index].pointers.z)].mass = 1.0;
                        quads.quads[u32(quads.quads[index].pointers.z)].CoM = vec2<f32>(x, y);
                    } else {
                        quads.quads[u32(quads.quads[index].pointers.x)].mass = 1.0;
                        quads.quads[u32(quads.quads[index].pointers.x)].CoM = vec2<f32>(x, y);     
                    }
                } else {
                    if (y <= boundary.y + boundary.h / 2.0) {
                        quads.quads[u32(quads.quads[index].pointers.w)].mass = 1.0;
                        quads.quads[u32(quads.quads[index].pointers.w)].CoM = vec2<f32>(x, y);
                    } else {
                        quads.quads[u32(quads.quads[index].pointers.y)].mass = 1.0;
                        quads.quads[u32(quads.quads[index].pointers.y)].CoM = vec2<f32>(x, y);     
                    }
                }  
            } 
            let node_x : f32 = nodes.nodes[i].x;
            let node_y : f32 = nodes.nodes[i].y;
            // We are inserting in this cell so change mass and CoM
            let mass : f32 = quads.quads[index].mass;
            quads.quads[index].CoM = (mass * quads.quads[index].CoM + vec2<f32>(node_x, node_y)) / (mass + 1.0);
            quads.quads[index].mass = mass + 1.0;
            // Find where to recurse to
            if (node_x <= boundary.x + boundary.w / 2.0) {
                if (node_y <= boundary.y + boundary.h / 2.0) {
                    index = u32(quads.quads[index].pointers.z);
                } else {
                    index = u32(quads.quads[index].pointers.x);  
                }
            } else {
                if (node_y <= boundary.y + boundary.h / 2.0) {
                    index = u32(quads.quads[index].pointers.w);
                } else {
                    index = u32(quads.quads[index].pointers.y);
                }
            }
            if (index == 0u || counter > u32(uniforms.nodes_length) * 4u) {
                quads.quads[0].test = f32(i);
                break;
            }
        }
        if (counter > u32(uniforms.nodes_length) * 4u) {
            break;
        }
    }
    quads.quads[2].test = f32(counter);
}