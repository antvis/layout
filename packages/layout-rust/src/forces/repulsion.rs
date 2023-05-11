use crate::{layout::*, util::*};

use itertools::izip;
use rayon::prelude::*;

pub fn apply_repulsion_forceatlas2_2d_parallel(
    layout: &mut Layout,
) {
    let kr = layout.settings.kr;
    let max_distance2 = layout.settings.max_distance * layout.settings.max_distance;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass + 1.0;
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };

                    let d2 = dx * dx + dy * dy;
                    if d2 < max_distance2 {

                        let f = n1_mass * (*n2.mass + 1.0) / d2 * kr;

                        let vx = f * dx;
                        let vy = f * dy;

                        unsafe { *n1.speed.get_unchecked_mut(0) -= vx };
                        unsafe { *n1.speed.get_unchecked_mut(1) -= vy };
                        unsafe { *n2.speed.get_unchecked_mut(0) += vx };
                        unsafe { *n2.speed.get_unchecked_mut(1) += vy };
                    }
                }
            }
        });
    }
}

pub fn apply_repulsion_forceatlas2_3d_parallel(
    layout: &mut Layout,
) {
    let kr = layout.settings.kr;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass + 1.0;
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };
                    let dz = unsafe { *n2.pos.get_unchecked(2) - *n1.pos.get_unchecked(2) };

                    let d2 = dx * dx + dy * dy + dz * dz;
                    if d2 == 0.0 {
                        continue;
                    }

                    let f = n1_mass * (*n2.mass + 1.0) / d2 * kr;

                    let vx = f * dx;
                    let vy = f * dy;
                    let vz = f * dz;

                    unsafe { *n1.speed.get_unchecked_mut(0) -= vx };
                    unsafe { *n1.speed.get_unchecked_mut(1) -= vy };
                    unsafe { *n1.speed.get_unchecked_mut(2) -= vz };
                    unsafe { *n2.speed.get_unchecked_mut(0) += vx };
                    unsafe { *n2.speed.get_unchecked_mut(1) += vy };
                    unsafe { *n2.speed.get_unchecked_mut(2) += vz };
                }
            }
        });
    }
}

pub fn apply_repulsion_forceatlas2_po(layout: &mut Layout) {
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
        let n1_mass = n1_mass.clone() + 1.0;
        n2_iter.offset = (n1 + 1) * layout.settings.dimensions;
        for (n2, n2_pos) in (0..n1).zip(&mut n2_iter) {
            di.clone_from_slice(n2_pos);

            let d2 = di
                .iter_mut()
                .zip(n1_pos.iter())
                .map(|(di, n1_pos)| {
                    *di -= n1_pos.clone();
                    di.clone().powi(2)
                })
                .sum::<f32>();
            if d2 == 0.0 {
                continue;
            }

            let d = d2.clone().sqrt();
            let dprime = d.clone() - node_size.clone();

            let f = n1_mass.clone()
                * (unsafe { layout.masses.get_unchecked(n2) }.clone() + 1.0)
                / d2
                * if dprime < 0.0 {
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


pub fn apply_repulsion_force2_2d_parallel(
    layout: &mut Layout,
) {
    let factor = layout.settings.factor;
    let coulomb_dis_scale = layout.settings.coulomb_dis_scale;
    let node_strength = layout.settings.node_strength;
    let weight = node_strength * factor / coulomb_dis_scale / coulomb_dis_scale;
    let max_distance2 = layout.settings.max_distance * layout.settings.max_distance;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass;
                for n2 in n1.n2_iter {
                    let n2_mass = *n2.mass;
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };

                    let d2 = dx * dx + dy * dy;

                    if d2 < max_distance2 {
                        let d3 = d2.sqrt() * d2;
                        let param = weight / d3;

                        unsafe { *n1.speed.get_unchecked_mut(0) -= dx * param / n1_mass };
                        unsafe { *n1.speed.get_unchecked_mut(1) -= dy * param / n1_mass };
                        unsafe { *n2.speed.get_unchecked_mut(0) += dx * param / n2_mass };
                        unsafe { *n2.speed.get_unchecked_mut(1) += dy * param / n2_mass };
                    }
                }
            }
        });
    }
}

pub fn apply_repulsion_force2_3d_parallel(
    layout: &mut Layout,
) {
    let factor = layout.settings.factor;
    let coulomb_dis_scale = layout.settings.coulomb_dis_scale;
    let node_strength = layout.settings.node_strength;
    let weight = node_strength * factor / coulomb_dis_scale / coulomb_dis_scale;
    let max_distance2 = layout.settings.max_distance * layout.settings.max_distance;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                let n1_mass = *n1.mass;
                for n2 in n1.n2_iter {
                    let n2_mass = *n2.mass;
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };
                    let dz = unsafe { *n2.pos.get_unchecked(2) - *n1.pos.get_unchecked(2) };

                    let d2 = dx * dx + dy * dy + dz * dz;

                    if d2 < max_distance2 {
                        let d3 = d2.sqrt() * d2;
                        let param = weight / d3;

                        unsafe { *n1.speed.get_unchecked_mut(0) -= dx * param / n1_mass };
                        unsafe { *n1.speed.get_unchecked_mut(1) -= dy * param / n1_mass };
                        unsafe { *n1.speed.get_unchecked_mut(2) -= dz * param / n1_mass };
                        unsafe { *n2.speed.get_unchecked_mut(0) += dx * param / n2_mass };
                        unsafe { *n2.speed.get_unchecked_mut(1) += dy * param / n2_mass };
                        unsafe { *n2.speed.get_unchecked_mut(2) += dz * param / n2_mass };
                    }
                }
            }
        });
    }
}

pub fn apply_repulsion_fruchterman_2d_parallel(
    layout: &mut Layout,
) {
    let k = layout.settings.ka;
    let k2 = k * k;
    let max_distance2 = layout.settings.max_distance * layout.settings.max_distance;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };

                    let d2 = dx * dx + dy * dy + 0.01;

                    if d2 < max_distance2 {
                        let param = k2 / d2;

                        unsafe { *n1.speed.get_unchecked_mut(0) -= dx * param };
                        unsafe { *n1.speed.get_unchecked_mut(1) -= dy * param };
                        unsafe { *n2.speed.get_unchecked_mut(0) += dx * param };
                        unsafe { *n2.speed.get_unchecked_mut(1) += dy * param };
                    }
                }
            }
        });
    }
}

pub fn apply_repulsion_fruchterman_3d_parallel(
    layout: &mut Layout,
) {
    let k = layout.settings.ka;
    let k2 = k * k;
    let max_distance2 = layout.settings.max_distance * layout.settings.max_distance;
    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            for n1 in n1_iter {
                for n2 in n1.n2_iter {
                    let dx = unsafe { *n2.pos.get_unchecked(0) - *n1.pos.get_unchecked(0) };
                    let dy = unsafe { *n2.pos.get_unchecked(1) - *n1.pos.get_unchecked(1) };
                    let dz = unsafe { *n2.pos.get_unchecked(2) - *n1.pos.get_unchecked(2) };

                    let d2 = dx * dx + dy * dy + dz * dz + 0.01;

                    if d2 < max_distance2 {
                        let param = k2 / d2;

                        unsafe { *n1.speed.get_unchecked_mut(0) -= dx * param };
                        unsafe { *n1.speed.get_unchecked_mut(1) -= dy * param };
                        unsafe { *n1.speed.get_unchecked_mut(2) -= dz * param };
                        unsafe { *n2.speed.get_unchecked_mut(0) += dx * param };
                        unsafe { *n2.speed.get_unchecked_mut(1) += dy * param };
                        unsafe { *n2.speed.get_unchecked_mut(2) += dz * param };
                    }
                }
            }
        });
    }
}