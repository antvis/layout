use crate::{layout::Layout, util::*};

use itertools::izip;
use rayon::vec;

pub fn apply_attraction_force2_2d<T: Copy + Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let n1_pos = layout.points.get(*n1);
        let n2_pos = layout.points.get(*n2);

        let n1_mass = layout.masses.get(*n1).unwrap().clone();
        let n2_mass = layout.masses.get(*n2).unwrap().clone();

        let (n1_speed, n2_speed) = layout.speeds.get_2_mut(*n1, *n2);

        let dx = unsafe { *n2_pos.get_unchecked(0) - *n1_pos.get_unchecked(0) };
        let dy = unsafe { *n2_pos.get_unchecked(1) - *n1_pos.get_unchecked(1) };

        let vec_length = (dx * dx + dy * dy).sqrt();
        let dire_x = dx / vec_length;
        let dire_y = dy / vec_length;

        let diff = layout.settings.link_distance - vec_length;
        let param = diff * layout.settings.edge_strength;

        let target_mass_ratio = T::one() / n1_mass;
        let source_mass_ratio = T::one() / n2_mass;
        let dis_x = dire_x * param;
        let dis_y = dire_y * param;

        unsafe { n1_speed.get_unchecked_mut(0) }.add_assign(dis_x * target_mass_ratio);
        unsafe { n1_speed.get_unchecked_mut(1) }.add_assign(dis_y * target_mass_ratio);
        unsafe { n2_speed.get_unchecked_mut(0) }.sub_assign(dis_x * source_mass_ratio);
        unsafe { n2_speed.get_unchecked_mut(1) }.sub_assign(dis_y * source_mass_ratio);
    }
}


pub fn apply_attraction_fruchterman_2d<T: Copy + Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let k = layout.settings.ka.clone();
    for (_edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let n1_pos = layout.points.get(*n1);
        let n2_pos = layout.points.get(*n2);

        let (n1_speed, n2_speed) = layout.speeds.get_2_mut(*n1, *n2);

        let dx = unsafe { *n2_pos.get_unchecked(0) - *n1_pos.get_unchecked(0) };
        let dy = unsafe { *n2_pos.get_unchecked(1) - *n1_pos.get_unchecked(1) };

        let vec_length = (dx * dx + dy * dy).sqrt();
        let common = vec_length * vec_length / k;

        unsafe { n1_speed.get_unchecked_mut(0) }.add_assign(dx / vec_length * common);
        unsafe { n1_speed.get_unchecked_mut(1) }.add_assign(dy / vec_length * common);
        unsafe { n2_speed.get_unchecked_mut(0) }.sub_assign(dx / vec_length * common);
        unsafe { n2_speed.get_unchecked_mut(1) }.sub_assign(dy / vec_length * common);
    }
}

pub fn apply_attraction_forceatlas2_2d<T: Copy + Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let (n1, n2) = (*n1, *n2);

        let n1_pos = layout.points.get(n1);
        let n2_pos = layout.points.get(n2);

        let weight = layout
            .weights
            .as_ref()
            .map_or(layout.settings.ka, |weights| {
                layout.settings.ka * weights[edge]
            });

        let (n1_speed, n2_speed) = layout.speeds.get_2_mut(n1, n2);

        let dx = unsafe { *n2_pos.get_unchecked(0) - *n1_pos.get_unchecked(0) } * weight;
        let dy = unsafe { *n2_pos.get_unchecked(1) - *n1_pos.get_unchecked(1) } * weight;

        unsafe { n1_speed.get_unchecked_mut(0) }.add_assign(dx);
        unsafe { n1_speed.get_unchecked_mut(1) }.add_assign(dy);
        unsafe { n2_speed.get_unchecked_mut(0) }.sub_assign(dx);
        unsafe { n2_speed.get_unchecked_mut(1) }.sub_assign(dy);
    }
}

pub fn apply_attraction_forceatlas2_3d<T: Copy + Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let (n1, n2) = (*n1, *n2);

        let n1_pos = layout.points.get(n1);
        let n2_pos = layout.points.get(n2);
        let weight = layout
            .weights
            .as_ref()
            .map_or_else(T::one, |weights| weights[edge])
            * layout.settings.ka;

        let (n1_speed, n2_speed) = layout.speeds.get_2_mut(n1, n2);

        let dx = unsafe { *n2_pos.get_unchecked(0) - *n1_pos.get_unchecked(0) } * weight;
        let dy = unsafe { *n2_pos.get_unchecked(1) - *n1_pos.get_unchecked(1) } * weight;
        let dz = unsafe { *n2_pos.get_unchecked(2) - *n1_pos.get_unchecked(2) } * weight;

        unsafe { n1_speed.get_unchecked_mut(0) }.add_assign(dx);
        unsafe { n1_speed.get_unchecked_mut(1) }.add_assign(dy);
        unsafe { n1_speed.get_unchecked_mut(2) }.add_assign(dz);
        unsafe { n2_speed.get_unchecked_mut(0) }.sub_assign(dx);
        unsafe { n2_speed.get_unchecked_mut(1) }.sub_assign(dy);
        unsafe { n2_speed.get_unchecked_mut(2) }.sub_assign(dz);
    }
}

pub fn apply_attraction_forceatlas2_dh<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let f = layout.weights.as_ref().map_or_else(
            || layout.settings.ka.clone(),
            |weights| layout.settings.ka.clone() * weights[edge].clone(),
        );
        let n1_speed = layout.speeds.get_mut(*n1);
        let n1_pos = layout.points.get(*n1);
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        let n1_mass = layout.masses.get(*n1).unwrap().clone();
        for (n1_speed, n1_pos, di) in izip!(n1_speed, n1_pos, di.iter_mut()) {
            *di -= n1_pos.clone();
            *di /= n1_mass.clone();
            *di *= f.clone();
            *n1_speed += di.clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= di[i].clone();
        }
    }
}

pub fn apply_attraction_forceatlas2_log<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let mut d = T::zero();
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        for (di, n1) in di.iter_mut().zip(layout.points.get(*n1)) {
            *di -= n1.clone();
            d += di.clone().pow_n(2u32);
        }
        if d.is_zero() {
            continue;
        }
        d = d.sqrt();

        let f = d.clone().ln_1p() / d
            * layout.weights.as_ref().map_or_else(
                || layout.settings.ka.clone(),
                |weights| layout.settings.ka.clone() * weights[edge].clone(),
            );

        let n1_speed = layout.speeds.get_mut(*n1);
        for i in 0usize..layout.settings.dimensions {
            n1_speed[i] += f.clone() * di[i].clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= f.clone() * di[i].clone();
        }
    }
}

pub fn apply_attraction_forceatlas2_dh_log<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let mut d = T::zero();
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        for (di, n1) in di.iter_mut().zip(layout.points.get(*n1)) {
            *di -= n1.clone();
            d += di.clone().pow_n(2u32);
        }
        if d.is_zero() {
            continue;
        }
        d = d.sqrt();

        let n1_mass = layout.masses.get(*n1).unwrap().clone();
        let f = d.clone().ln_1p() / d / n1_mass
            * layout.weights.as_ref().map_or_else(
                || layout.settings.ka.clone(),
                |weights| layout.settings.ka.clone() * weights[edge].clone(),
            );

        let n1_speed = layout.speeds.get_mut(*n1);
        for i in 0usize..layout.settings.dimensions {
            n1_speed[i] += f.clone() * di[i].clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= f.clone() * di[i].clone();
        }
    }
}

pub fn apply_attraction_forceatlas2_po<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let node_size = &layout.settings.prevent_overlapping.as_ref().unwrap().0;
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let mut d = T::zero();
        let n1_pos = layout.points.get(*n1);
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        for i in 0usize..layout.settings.dimensions {
            di[i] -= n1_pos[i].clone();
            d += di[i].clone().pow_n(2u32);
        }
        d = d.sqrt();

        let dprime = d.clone() - node_size.clone();
        if dprime.non_positive() {
            continue;
        }
        let f = dprime / d
            * layout.weights.as_ref().map_or_else(
                || layout.settings.ka.clone(),
                |weights| layout.settings.ka.clone() * weights[edge].clone(),
            );

        let n1_speed = layout.speeds.get_mut(*n1);
        for i in 0usize..layout.settings.dimensions {
            n1_speed[i] += f.clone() * di[i].clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= f.clone() * di[i].clone();
        }
    }
}

pub fn apply_attraction_forceatlas2_dh_po<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let node_size = &layout.settings.prevent_overlapping.as_ref().unwrap().0;
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let mut d = T::zero();
        let n1_pos = layout.points.get(*n1);
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        for i in 0usize..layout.settings.dimensions {
            di[i] -= n1_pos[i].clone();
            d += di[i].clone().pow_n(2u32);
        }
        d = d.sqrt();

        let dprime = d.clone() - node_size.clone();
        if dprime.non_positive() {
            dbg!(dprime);
            continue;
        }
        let n1_mass = layout.masses.get(*n1).unwrap().clone();
        let f = dprime / d / n1_mass
            * layout.weights.as_ref().map_or_else(
                || layout.settings.ka.clone(),
                |weights| layout.settings.ka.clone() * weights[edge].clone(),
            );

        let n1_speed = layout.speeds.get_mut(*n1);
        for i in 0usize..layout.settings.dimensions {
            n1_speed[i] += f.clone() * di[i].clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= f.clone() * di[i].clone();
        }
    }
}

pub fn apply_attraction_forceatlas2_log_po<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let node_size = &layout.settings.prevent_overlapping.as_ref().unwrap().0;
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let mut d = T::zero();
        let n1_pos = layout.points.get(*n1);
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        for i in 0usize..layout.settings.dimensions {
            di[i] -= n1_pos[i].clone();
            d += di[i].clone().pow_n(2u32);
        }
        d = d.sqrt();

        let dprime = d - node_size.clone();
        if dprime.non_positive() {
            continue;
        }
        let f = dprime.clone().ln_1p() / dprime
            * layout.weights.as_ref().map_or_else(
                || layout.settings.ka.clone(),
                |weights| layout.settings.ka.clone() * weights[edge].clone(),
            );

        let n1_speed = layout.speeds.get_mut(*n1);
        for i in 0usize..layout.settings.dimensions {
            n1_speed[i] += f.clone() * di[i].clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= f.clone() * di[i].clone();
        }
    }
}

pub fn apply_attraction_forceatlas2_dh_log_po<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let node_size = &layout.settings.prevent_overlapping.as_ref().unwrap().0;
    for (edge, (n1, n2)) in layout.edges.iter().enumerate() {
        let mut d = T::zero();
        let n1_pos = layout.points.get(*n1);
        let mut di_v = layout.points.get_clone(*n2);
        let di = di_v.as_mut_slice();
        for i in 0usize..layout.settings.dimensions {
            di[i] -= n1_pos[i].clone();
            d += di[i].clone().pow_n(2u32);
        }
        d = d.sqrt();

        let dprime = d - node_size.clone();
        if dprime.non_positive() {
            continue;
        }
        let n1_mass = layout.masses.get(*n1).unwrap().clone();
        let f = dprime.clone().ln_1p() / dprime / n1_mass
            * layout.weights.as_ref().map_or_else(
                || layout.settings.ka.clone(),
                |weights| layout.settings.ka.clone() * weights[edge].clone(),
            );

        let n1_speed = layout.speeds.get_mut(*n1);
        for i in 0usize..layout.settings.dimensions {
            n1_speed[i] += f.clone() * di[i].clone();
        }
        let n2_speed = layout.speeds.get_mut(*n2);
        for i in 0usize..layout.settings.dimensions {
            n2_speed[i] -= f.clone() * di[i].clone();
        }
    }
}
