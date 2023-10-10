use crate::{GraphConfig, GraphEdge, GraphNode};
use graphlib_rust::graph::GRAPH_NODE;
use graphlib_rust::Graph;
use ordered_hashmap::OrderedHashMap;

pub fn parent_dummy_chains(g: &mut Graph<GraphConfig, GraphNode, GraphEdge>) {
    let post_order_nums: OrderedHashMap<String, (i32, i32)> = postorder(g);
    let dummy_chains = g.graph().dummy_chains.clone().unwrap_or(vec![]);
    let empty_string = "".to_string();
    let empty_node = GraphNode::default();

    for v_ in dummy_chains.iter() {
        let mut v = v_.clone();
        let mut node = g.node(&v).unwrap();
        let edge_obj = node.edge_obj.clone().unwrap();
        let path_data = find_path(g, &post_order_nums, &edge_obj.v, &edge_obj.w);
        let path = path_data.0;
        let lca = &path_data.1;
        let mut path_idx = 0;
        // if path is empty
        if path.len() == 0 {
            continue;
        }
        let mut path_v = path.get(path_idx).unwrap();
        let mut ascending = true;

        while v != edge_obj.w {
            node = g.node(&v).unwrap();

            if ascending {
                path_v = path.get(path_idx).unwrap_or(lca);
                while path_v != lca
                    && g.node(path_v)
                        .unwrap_or(&empty_node)
                        .max_rank
                        .clone()
                        .unwrap_or(0)
                        < node.rank.clone().unwrap_or(0)
                {
                    path_idx += 1;
                    if let Some(path_v_) = path.get(path_idx) {
                        path_v = path_v_;
                    } else {
                        break;
                    }
                }

                if path_v == lca {
                    ascending = false
                }
            }

            if !ascending {
                path_v = path.get(path_idx + 1).unwrap_or(&empty_string);
                while path_idx < path.len() - 1
                    && g.node(path_v).unwrap().min_rank.clone().unwrap_or(0)
                        <= node.rank.clone().unwrap_or(0)
                {
                    path_idx += 1;
                    path_v = path.get(path_idx + 1).unwrap_or(&empty_string);
                }
            }

            let _ = g.set_parent(&v, Some(path_v.clone()));
            v = g
                .successors(&v)
                .unwrap_or(vec![])
                .get(0)
                .unwrap_or(&empty_string)
                .clone();
        }
    }
}

// Find a path from v to w through the lowest common ancestor (LCA). Return the
// full path and the LCA.
fn find_path(
    g: &Graph<GraphConfig, GraphNode, GraphEdge>,
    post_order_nums: &OrderedHashMap<String, (i32, i32)>,
    v: &String,
    w: &String,
) -> (Vec<String>, String) {
    let mut v_path: Vec<String> = vec![];
    let mut w_path: Vec<String> = vec![];

    let v_post_order_num = post_order_nums.get(v).cloned().unwrap_or((0, 0));
    let w_post_order_num = post_order_nums.get(w).cloned().unwrap_or((0, 0));
    let low = std::cmp::min(v_post_order_num.0, w_post_order_num.0);
    let lim = std::cmp::min(v_post_order_num.1, w_post_order_num.1);

    // Traverse up from v to find the LCA
    let mut _parent = v;
    while let Some(parent) = g.parent(_parent) {
        _parent = parent;
        v_path.push(parent.clone());
        if let Some(post_order_num) = post_order_nums.get(parent) {
            if post_order_num.0 <= low && lim <= post_order_num.1 {
                break;
            }
        } else {
            break;
        }
    }

    let lca = _parent;
    // Traverse from w to LCA
    let mut parent = g.parent(w).unwrap_or(lca);
    while parent != lca {
        w_path.push(parent.clone());
        parent = g.parent(parent).unwrap_or(lca);
    }

    w_path.reverse();
    v_path.append(&mut w_path);
    return (v_path, lca.clone());
}

fn postorder(g: &Graph<GraphConfig, GraphNode, GraphEdge>) -> OrderedHashMap<String, (i32, i32)> {
    let mut result: OrderedHashMap<String, (i32, i32)> = OrderedHashMap::new();
    let mut lim = 0;

    fn dfs(
        v: &String,
        g: &Graph<GraphConfig, GraphNode, GraphEdge>,
        lim: &mut i32,
        result: &mut OrderedHashMap<String, (i32, i32)>,
    ) {
        let low = lim.clone();
        g.children(&v).iter().for_each(|v_| {
            dfs(v_, g, lim, result);
        });
        result.insert(v.clone(), (low, lim.clone()));
        *lim += 1;
    }

    g.children(&GRAPH_NODE.to_string()).iter().for_each(|v| {
        dfs(v, g, &mut lim, &mut result);
    });

    return result;
}
