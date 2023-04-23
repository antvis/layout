use crate::{iter::*, layout::*, util::*};

use itertools::izip;
use rayon::prelude::*;

pub fn apply_repulsion_forceatlas2_2d_parallel<T: Copy + Coord + std::fmt::Debug + Send + Sync>(
    layout: &mut Layout<T>,
) {
    let kr = layout.settings.kr;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass + T::one();
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };

                    let d2 = dx * dx + dy * dy;
                    if d2.is_zero() {
                        continue;
                    }

                    let f = n1_mass * (*n2.mass + T::one()) / d2 * kr;

                    let vx = f * dx;
                    let vy = f * dy;
                    unsafe { n1.speed.get_unchecked_mut(0) }.sub_assign(vx); // n1_speed[0] -= f * dx
                    unsafe { n1.speed.get_unchecked_mut(1) }.sub_assign(vy); // n1_speed[1] -= f * dy
                    unsafe { n2.speed.get_unchecked_mut(0) }.add_assign(vx); // n2_speed[0] += f * dx
                    unsafe { n2.speed.get_unchecked_mut(1) }.add_assign(vy); // n2_speed[1] += f * dy
                }
            }
        });
    }
}

pub fn apply_repulsion_forceatlas2_3d_parallel<T: Copy + Coord + std::fmt::Debug + Send + Sync>(
    layout: &mut Layout<T>,
) {
    let kr = layout.settings.kr;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass + T::one();
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };
                    let dz = unsafe { *n2.pos.get_unchecked(2) - *n1.pos.get_unchecked(2) };

                    let d2 = dx * dx + dy * dy + dz * dz;
                    if d2.is_zero() {
                        continue;
                    }

                    let f = n1_mass * (*n2.mass + T::one()) / d2 * kr;

                    let vx = f * dx;
                    let vy = f * dy;
                    let vz = f * dz;
                    unsafe { n1.speed.get_unchecked_mut(0) }.sub_assign(vx);
                    unsafe { n1.speed.get_unchecked_mut(1) }.sub_assign(vy);
                    unsafe { n1.speed.get_unchecked_mut(2) }.sub_assign(vz);
                    unsafe { n2.speed.get_unchecked_mut(0) }.add_assign(vx);
                    unsafe { n2.speed.get_unchecked_mut(1) }.add_assign(vy);
                    unsafe { n2.speed.get_unchecked_mut(2) }.add_assign(vz);
                }
            }
        });
    }
}

pub fn apply_repulsion_forceatlas2_po<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let mut di = valloc(layout.settings.dimensions);
    let (node_size, krprime) = unsafe {
        layout
            .settings
            .prevent_overlapping
            .as_ref()
            .unwrap_unchecked()
    };
    for (n1, (n1_mass, n1_pos)) in layout.masses.iter().zip(layout.points.iter()).enumerate() {
        let mut n2_iter = layout.points.iter();
        let n1_mass = n1_mass.clone() + T::one();
        n2_iter.offset = (n1 + 1) * layout.settings.dimensions;
        for (n2, n2_pos) in (0..n1).zip(&mut n2_iter) {
            di.clone_from_slice(n2_pos);

            let d2 = di
                .iter_mut()
                .zip(n1_pos.iter())
                .map(|(di, n1_pos)| {
                    *di -= n1_pos.clone();
                    di.clone().pow_n(2u32)
                })
                .sum::<T>();
            if d2.is_zero() {
                continue;
            }

            let d = d2.clone().sqrt();
            let dprime = d.clone() - node_size.clone();

            let f = n1_mass.clone()
                * (unsafe { layout.masses.get_unchecked(n2) }.clone() + T::one())
                / d2
                * if dprime.positive() {
                    layout.settings.kr.clone() / dprime
                } else {
                    krprime.clone()
                };

            let (n1_speed, n2_speed) = layout.speeds.get_2_mut(n1, n2);
            izip!(n1_speed.iter_mut(), n2_speed.iter_mut(), di.iter()).for_each(
                |(n1_speed, n2_speed, di)| {
                    let s = f.clone() * di.clone();
                    *n1_speed -= s.clone();
                    *n2_speed += s;
                },
            );
        }
    }
}


pub fn apply_repulsion_force2_2d_parallel<T: Copy + Coord + std::fmt::Debug + Send + Sync>(
    layout: &mut Layout<T>,
) {
    let factor = layout.settings.factor;
    let coulomb_dis_scale2 = layout.settings.coulomb_dis_scale * layout.settings.coulomb_dis_scale;
    let weight_param = factor / coulomb_dis_scale2;
    let node_strength = layout.settings.node_strength;

    let kr = layout.settings.kr;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass + T::one();
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };

                    let d2 = dx * dx + dy * dy;
                    if d2.is_zero() {
                        continue;
                    }

                    let f = n1_mass * (*n2.mass + T::one()) / d2 * kr;

                    let vx = f * dx;
                    let vy = f * dy;
                    unsafe { n1.speed.get_unchecked_mut(0) }.sub_assign(vx); // n1_speed[0] -= f * dx
                    unsafe { n1.speed.get_unchecked_mut(1) }.sub_assign(vy); // n1_speed[1] -= f * dy
                    unsafe { n2.speed.get_unchecked_mut(0) }.add_assign(vx); // n2_speed[0] += f * dx
                    unsafe { n2.speed.get_unchecked_mut(1) }.add_assign(vy); // n2_speed[1] += f * dy
                }
            }
        });
    }
}

pub fn apply_repulsion_fruchterman_2d_parallel<T: Copy + Coord + std::fmt::Debug + Send + Sync>(
    layout: &mut Layout<T>,
) {
    let k = layout.settings.ka.clone();
    let k2 = k * k;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };

                    let d2 = dx * dx + dy * dy;
                    
                    if !d2.is_zero() {
                        let common = k2 / d2;

                        unsafe { n1.speed.get_unchecked_mut(0) }.sub_assign(dx * common);
                        unsafe { n1.speed.get_unchecked_mut(1) }.sub_assign(dy * common);
                        unsafe { n2.speed.get_unchecked_mut(0) }.add_assign(dx * common);
                        unsafe { n2.speed.get_unchecked_mut(1) }.add_assign(dy * common);
                    }
                }
            }
        });
    }
}