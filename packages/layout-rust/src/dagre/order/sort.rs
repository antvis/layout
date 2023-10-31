use crate::dagre::order::resolve_conflicts::ResolvedBaryEntry;
use crate::dagre::order::sort_subgraph::SubgraphResult;
use crate::dagre::util;
use crate::dagre::util::PartitionResponse;
use std::cmp::Ordering;

pub fn sort(entries: &Vec<ResolvedBaryEntry>, bias_right: &bool) -> SubgraphResult {
    let parts: PartitionResponse<ResolvedBaryEntry> = util::partition(
        entries,
        Box::new(|val: &ResolvedBaryEntry| -> bool { val.barycenter.is_some() }),
    );

    let mut sortable = parts.lhs.clone();
    sortable.sort_by(|e1, e2| compare_with_bias(e1, e2, bias_right));
    let mut unsortable = parts.rhs.clone();
    unsortable.sort_by(|e1, e2| e2.i.cmp(&e1.i));

    let mut vs: Vec<String> = vec![];
    let mut sum = 0.0;
    let mut weight = 0.0;
    let mut vs_index: usize = 0;

    vs_index = consume_unsortable(&mut vs, &mut sortable, &mut vs_index);
    sortable.iter().for_each(|entry| {
        vs_index += entry.vs.len();
        vs.append(entry.vs.clone().as_mut());
        let entry_weight = entry.weight.clone().unwrap_or(0.0);
        sum += entry.barycenter.clone().unwrap_or(0.0) * entry_weight.clone();
        weight += entry_weight.clone();
        vs_index = consume_unsortable(&mut vs, &mut unsortable, &mut vs_index);
    });

    let mut result = SubgraphResult::default();
    result.vs = vs;
    if weight > 0.0 {
        result.barycenter = sum / weight;
        result.weight = weight;
    }

    return result;
}

fn consume_unsortable(
    vs: &mut Vec<String>,
    unsortable: &mut Vec<ResolvedBaryEntry>,
    index: &mut usize,
) -> usize {
    if unsortable.len() == 0 {
        return index.clone();
    }
    let mut last: ResolvedBaryEntry = unsortable.get(unsortable.len() - 1).cloned().unwrap();
    while unsortable.len() > 0 && &last.i <= index {
        vs.append(last.vs.clone().as_mut());
        last = unsortable.pop().unwrap();
        *index += 1;
    }
    return index.clone();
}

fn compare_with_bias(
    entry_v: &ResolvedBaryEntry,
    entry_w: &ResolvedBaryEntry,
    bias: &bool,
) -> Ordering {
    let barycenter_v = entry_v.barycenter.clone().unwrap_or(0.0) as i32;
    let barycenter_w = entry_w.barycenter.clone().unwrap_or(0.0) as i32;
    if barycenter_v < barycenter_w {
        return Ordering::Greater;
    } else if barycenter_v > barycenter_w {
        return Ordering::Less;
    }

    return if !bias {
        entry_v.i.cmp(&entry_w.i)
    } else {
        entry_w.i.cmp(&entry_v.i)
    };
}
