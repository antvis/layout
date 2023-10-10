/*
 * Given a list of entries of the form {v, barycenter, weight} and a
 * constraint graph this function will resolve any conflicts between the
 * constraint graph and the barycenters for the entries. If the barycenters for
 * an entry would violate a constraint in the constraint graph then we coalesce
 * the nodes in the conflict into a new node that respects the contraint and
 * aggregates barycenter and weight information.
 *
 * This implementation is based on the description in Forster, "A Fast and
 * Simple Hueristic for Constrained Two-Level Crossing Reduction," thought it
 * differs in some specific details.
 *
 * Pre-conditions:
 *
 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
 *       no barycenter, then {v}.
 *
 * Returns:
 *
 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
 *    `vs` may either be a singleton or it may be an aggregation of nodes
 *    ordered such that they do not violate constraints from the constraint
 *    graph. The property `i` is the lowest original index of any of the
 *    elements in `vs`.
 */
use crate::{GraphConfig, GraphEdge, GraphNode};
use graphlib_rust::Graph;
use ordered_hashmap::OrderedHashMap;

use super::barycenter::Barycenter;

#[derive(Debug, Clone)]
pub struct ResolvedBaryEntry {
    pub indegree: i32,
    pub _in: Vec<ResolvedBaryEntry>,
    pub _out: Vec<ResolvedBaryEntry>,
    pub vs: Vec<String>,
    pub i: usize,
    pub barycenter: Option<f32>,
    pub weight: Option<f32>,
    pub merged: Option<bool>,
}

pub fn resolve_conflicts(
    entries: &Vec<Barycenter>,
    cg: &Graph<GraphConfig, GraphNode, GraphEdge>,
) -> Vec<ResolvedBaryEntry> {
    let mut mapped_entries: OrderedHashMap<String, ResolvedBaryEntry> = OrderedHashMap::new();
    for (i, entry) in entries.iter().enumerate() {
        let mut mapped_entry = ResolvedBaryEntry {
            indegree: 0,
            _in: vec![],
            _out: vec![],
            vs: vec![entry.v.clone()],
            i,
            barycenter: None,
            weight: None,
            merged: None,
        };
        if mapped_entry.barycenter.is_some() {
            mapped_entry.barycenter = entry.barycenter.clone();
            mapped_entry.weight = entry.weight.clone();
        }
        mapped_entries.insert(entry.v.clone(), mapped_entry);
    }

    cg.edges().iter().for_each(|e| {
        let entry_v_ = mapped_entries.get(&e.v);
        let entry_w_ = mapped_entries.get(&e.w).cloned();
        if entry_v_.is_some() && entry_w_.is_some() {
            if let Some(entry_w) = mapped_entries.get_mut(&e.w) {
                entry_w.indegree += 1;
            }
            if let Some(entry_v) = mapped_entries.get_mut(&e.v) {
                entry_v._out.push(entry_w_.clone().unwrap());
            }
        }
    });

    let mut source_set: Vec<ResolvedBaryEntry> = mapped_entries
        .values()
        .filter(|entry| entry.indegree == 0)
        .cloned()
        .collect();

    return do_resolve_conflicts(&mut source_set);
}

fn do_resolve_conflicts(source_set: &mut Vec<ResolvedBaryEntry>) -> Vec<ResolvedBaryEntry> {
    let mut entries: Vec<ResolvedBaryEntry> = vec![];
    let mut source_hash: OrderedHashMap<usize, ResolvedBaryEntry> = OrderedHashMap::new();

    source_set.iter().for_each(|entry| {
        source_hash.insert(entry.i.clone(), entry.clone());
    });

    fn handle_in(
        v_idx: &usize,
        u_idx: &usize,
        source_hash: &mut OrderedHashMap<usize, ResolvedBaryEntry>,
    ) {
        let v_entry = source_hash.get(v_idx).unwrap();
        let u_entry = source_hash.get(u_idx).unwrap();
        if u_entry.merged.is_some() {
            return ();
        }

        if u_entry.barycenter.is_none()
            || v_entry.barycenter.is_none()
            || u_entry.barycenter.clone().unwrap_or(0.0)
                >= v_entry.barycenter.clone().unwrap_or(0.0)
        {
            merge_entries(v_idx, u_idx, source_hash);
        }
    }

    fn handle_out(
        v_idx: &usize,
        w_idx: &usize,
        source_hash: &mut OrderedHashMap<usize, ResolvedBaryEntry>,
        source_set: &mut Vec<ResolvedBaryEntry>,
    ) {
        let v_entry = source_hash.get(v_idx).cloned().unwrap();
        let w_entry = source_hash.get_mut(w_idx).unwrap();
        w_entry._in.push(v_entry);
        w_entry.indegree -= 1;
        if w_entry.indegree == 0 {
            source_set.push(w_entry.clone());
        }
    }

    while source_set.len() > 0 {
        let entry_ = source_set.pop().unwrap();
        let entry = source_hash.get(&entry_.i).unwrap();

        let _in = entry._in.clone();
        let out = entry_._out.clone();
        _in.iter().rev().for_each(|u_entry| {
            handle_in(&entry_.i, &u_entry.i, &mut source_hash);
        });
        out.iter().for_each(|w_entry| {
            handle_out(&entry_.i, &w_entry.i, &mut source_hash, source_set);
        });

        entries.push(source_hash.get(&entry_.i).cloned().unwrap());
    }

    return entries
        .into_iter()
        .filter(|entry| !entry.merged.clone().unwrap_or(false))
        .collect();
}

fn merge_entries(
    target_idx: &usize,
    source_idx: &usize,
    source_hash: &mut OrderedHashMap<usize, ResolvedBaryEntry>,
) {
    let mut sum = 0.0;
    let mut weight = 0.0;

    let target_ = source_hash.get(target_idx).cloned().unwrap();
    if target_.weight.is_some() {
        let target_weight = target_.weight.clone().unwrap_or(0.0);
        let target_barycenter = target_.barycenter.clone().unwrap_or(0.0);
        sum += target_barycenter * target_weight;
        weight += target_weight;
    }

    let source_ = source_hash.get(source_idx).cloned().unwrap();
    if source_.weight.is_some() {
        let source_weight = source_.weight.clone().unwrap_or(0.0);
        let source_barycenter = source_.barycenter.clone().unwrap_or(0.0);
        sum += source_barycenter * source_weight;
        weight += source_weight;
    }

    let mut target_vs = source_.vs.clone();
    target_vs.append(&mut target_.vs.clone());

    let target = source_hash.get_mut(target_idx).unwrap();
    target.vs = target_vs;
    target.barycenter = Some(sum / weight);
    target.weight = Some(weight);
    target.i = std::cmp::min(source_.i.clone(), target_.i.clone());

    let source = source_hash.get_mut(source_idx).unwrap();
    source.merged = Some(true);
}
