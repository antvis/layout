use crate::{iter::*, layout::*, util::*};

use itertools::izip;
#[cfg(feature = "parallel")]
use rayon::prelude::*;

pub fn apply_repulsion<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let kr = layout.settings.kr.clone();
    let mut di = valloc(layout.settings.dimensions);
    for Node {
        mass: n1_mass,
        n2_iter,
        pos: n1_pos,
        speed: n1_speed,
        ..
    } in layout.iter_nodes()
    {
        let n1_mass = n1_mass.clone() + T::one();
        for Node2 {
            mass: n2_mass,
            pos: n2_pos,
            speed: n2_speed,
            ..
        } in n2_iter
        {
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

            let f = n1_mass.clone() * (n2_mass.clone() + T::one()) / d2 * kr.clone();

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

#[cfg(feature = "parallel")]
pub fn apply_repulsion_parallel<T: Coord + std::fmt::Debug + Send + Sync>(layout: &mut Layout<T>) {
    let kr = layout.settings.kr.clone();
    let dimensions = layout.settings.dimensions;

    for chunk_iter in layout.iter_par_nodes(layout.settings.chunk_size.unwrap()) {
        chunk_iter.for_each(|n1_iter| {
            let mut di = valloc(dimensions);
            for n1 in n1_iter {
                let n1_mass = n1.mass.clone() + T::one();
                for n2 in n1.n2_iter {
                    di.clone_from_slice(n2.pos);

                    let d2 = di
                        .iter_mut()
                        .zip(n1.pos.iter())
                        .map(|(di, n1_pos)| {
                            *di -= n1_pos.clone();
                            di.clone().pow_n(2u32)
                        })
                        .sum::<T>();
                    if d2.is_zero() {
                        continue;
                    }

                    let f = n1_mass.clone() * (n2.mass.clone() + T::one()) / d2 * kr.clone();

                    izip!(n1.speed.iter_mut(), n2.speed.iter_mut(), di.iter()).for_each(
                        |(n1_speed, n2_speed, di)| {
                            let s = f.clone() * di.clone();
                            *n1_speed -= s.clone();
                            *n2_speed += s;
                        },
                    );
                }
            }
        });
    }
}

pub fn apply_repulsion_2d<T: Copy + Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let kr = layout.settings.kr;
    for Node {
        mass: n1_mass,
        n2_iter,
        pos: n1_pos,
        speed: n1_speed,
        ..
    } in layout.iter_nodes()
    {
        let n1_mass = *n1_mass + T::one();
        for Node2 {
            mass: n2_mass,
            pos: n2_pos,
            speed: n2_speed,
            ..
        } in n2_iter
        {
            let dx = unsafe { *n2_pos.get_unchecked(0) - *n1_pos.get_unchecked(0) };
            let dy = unsafe { *n2_pos.get_unchecked(1) - *n1_pos.get_unchecked(1) };

            let d2 = dx * dx + dy * dy;
            if d2.is_zero() {
                continue;
            }

            let f = n1_mass * (*n2_mass + T::one()) / d2 * kr;

            let vx = f * dx;
            let vy = f * dy;
            unsafe { n1_speed.get_unchecked_mut(0) }.sub_assign(vx); // n1_speed[0] -= f * dx
            unsafe { n1_speed.get_unchecked_mut(1) }.sub_assign(vy); // n1_speed[1] -= f * dy
            unsafe { n2_speed.get_unchecked_mut(0) }.add_assign(vx); // n2_speed[0] += f * dx
            unsafe { n2_speed.get_unchecked_mut(1) }.add_assign(vy); // n2_speed[1] += f * dy
        }
    }
}

#[cfg(feature = "parallel")]
pub fn apply_repulsion_2d_parallel<T: Copy + Coord + std::fmt::Debug + Send + Sync>(
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

pub fn apply_repulsion_3d<T: Copy + Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (n1, (n1_mass, n1_pos)) in layout.masses.iter().zip(layout.points.iter()).enumerate() {
        let mut n2_iter = layout.points.iter();
        let n1_mass = *n1_mass + T::one();
        for (n2, n2_pos) in (0..n1).zip(&mut n2_iter) {
            let dx = unsafe { *n2_pos.get_unchecked(0) - *n1_pos.get_unchecked(0) };
            let dy = unsafe { *n2_pos.get_unchecked(1) - *n1_pos.get_unchecked(1) };
            let dz = unsafe { *n2_pos.get_unchecked(2) - *n1_pos.get_unchecked(2) };

            let d2 = dx * dx + dy * dy + dz * dz;
            if d2.is_zero() {
                continue;
            }

            let f = n1_mass * (*unsafe { layout.masses.get_unchecked(n2) } + T::one()) / d2
                * layout.settings.kr;

            let (n1_speed, n2_speed) = layout.speeds.get_2_mut(n1, n2);
            unsafe { n1_speed.get_unchecked_mut(0) }.sub_assign(f * dx); // n1_speed[0] += f * dx
            unsafe { n1_speed.get_unchecked_mut(1) }.sub_assign(f * dy); // n1_speed[1] += f * dy
            unsafe { n1_speed.get_unchecked_mut(2) }.sub_assign(f * dz); // n1_speed[2] += f * dz
            unsafe { n2_speed.get_unchecked_mut(0) }.add_assign(f * dx); // n2_speed[0] -= f * dx
            unsafe { n2_speed.get_unchecked_mut(1) }.add_assign(f * dy); // n2_speed[1] -= f * dy
            unsafe { n2_speed.get_unchecked_mut(2) }.add_assign(f * dz); // n2_speed[2] -= f * dz
        }
    }
}

#[cfg(feature = "parallel")]
pub fn apply_repulsion_3d_parallel<T: Copy + Coord + std::fmt::Debug + Send + Sync>(
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

pub fn apply_repulsion_po<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
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

#[cfg(feature = "barnes_hut")]
pub fn apply_repulsion_bh_2d(layout: &mut Layout<f64>) {
    let particles: Vec<nbody_barnes_hut::particle_2d::Particle2D> = layout
        .points
        .iter()
        .zip(layout.masses.iter())
        .map(|(point, mass)| nbody_barnes_hut::particle_2d::Particle2D {
            position: nbody_barnes_hut::vector_2d::Vector2D {
                x: point[0],
                y: point[1],
            },
            mass: mass + 1.,
        })
        .collect();
    let tree = nbody_barnes_hut::barnes_hut_2d::QuadTree::new(
        &particles
            .iter()
            .collect::<Vec<&nbody_barnes_hut::particle_2d::Particle2D>>(),
        layout.settings.barnes_hut.unwrap(),
    );
    let kr = layout.settings.kr;

    izip!(
        particles.into_iter(),
        layout.speeds.iter_mut(),
        layout.masses.iter()
    )
    .for_each(|(particle, speed, mass)| {
        let nbody_barnes_hut::vector_2d::Vector2D { x, y } =
            tree.calc_forces_on_particle(particle.position, mass + 1., |d2, m1, dv, m2| {
                m2 as f64 * m1 / d2.sqrt() * kr * dv
            });
        speed[0] -= x;
        speed[1] -= y;
    });
}

#[cfg(feature = "barnes_hut")]
pub fn apply_repulsion_bh_2d_po(layout: &mut Layout<f64>) {
    let particles: Vec<nbody_barnes_hut::particle_2d::Particle2D> = layout
        .points
        .iter()
        .zip(layout.masses.iter())
        .map(|(point, mass)| nbody_barnes_hut::particle_2d::Particle2D {
            position: nbody_barnes_hut::vector_2d::Vector2D {
                x: point[0],
                y: point[1],
            },
            mass: mass + 1.,
        })
        .collect();
    let tree = nbody_barnes_hut::barnes_hut_2d::QuadTree::new(
        &particles
            .iter()
            .collect::<Vec<&nbody_barnes_hut::particle_2d::Particle2D>>(),
        layout.settings.barnes_hut.unwrap(),
    );
    let kr = layout.settings.kr;
    let (node_size, krprime) = unsafe { layout.settings.prevent_overlapping.unwrap_unchecked() };
    izip!(
        particles.into_iter(),
        layout.speeds.iter_mut(),
        layout.masses.iter()
    )
    .for_each(|(particle, speed, mass)| {
        let nbody_barnes_hut::vector_2d::Vector2D { x, y } =
            tree.calc_forces_on_particle(particle.position, mass + 1., |d2, m1, dv, m2| {
                let d = d2.sqrt();
                let dprime = d - node_size;
                (if dprime.positive() {
                    kr / dprime
                } else if dprime.is_zero() {
                    return nbody_barnes_hut::vector_2d::Vector2D { x: 0.0, y: 0.0 };
                } else {
                    krprime
                }) * m1
                    * m2
                    / d
                    * dv
            });
        speed[0] -= x;
        speed[1] -= y;
    });
}

#[cfg(feature = "barnes_hut")]
pub fn apply_repulsion_bh_3d(layout: &mut Layout<f64>) {
    let particles: Vec<nbody_barnes_hut::particle_3d::Particle3D> = layout
        .points
        .iter()
        .zip(layout.masses.iter())
        .map(|(point, mass)| nbody_barnes_hut::particle_3d::Particle3D {
            position: nbody_barnes_hut::vector_3d::Vector3D {
                x: point[0],
                y: point[1],
                z: point[2],
            },
            mass: mass + 1.,
        })
        .collect();
    let tree = nbody_barnes_hut::barnes_hut_3d::OctTree::new(
        &particles
            .iter()
            .collect::<Vec<&nbody_barnes_hut::particle_3d::Particle3D>>(),
        layout.settings.barnes_hut.unwrap(),
    );
    let kr = layout.settings.kr;
    izip!(
        particles.into_iter(),
        layout.speeds.iter_mut(),
        layout.masses.iter()
    )
    .for_each(|(particle, speed, mass)| {
        let nbody_barnes_hut::vector_3d::Vector3D { x, y, z } =
            tree.calc_forces_on_particle(particle.position, mass + 1., |d2, m1, dv, m2| {
                m2 * m1 / d2.sqrt() * kr * dv
            });
        speed[0] -= x;
        speed[1] -= y;
        speed[2] -= z;
    });
}

#[cfg(feature = "barnes_hut")]
pub fn apply_repulsion_bh_3d_po(layout: &mut Layout<f64>) {
    let particles: Vec<nbody_barnes_hut::particle_3d::Particle3D> = layout
        .points
        .iter()
        .zip(layout.masses.iter())
        .map(|(point, mass)| nbody_barnes_hut::particle_3d::Particle3D {
            position: nbody_barnes_hut::vector_3d::Vector3D {
                x: point[0],
                y: point[1],
                z: point[2],
            },
            mass: mass + 1.,
        })
        .collect();
    let tree = nbody_barnes_hut::barnes_hut_3d::OctTree::new(
        &particles
            .iter()
            .collect::<Vec<&nbody_barnes_hut::particle_3d::Particle3D>>(),
        layout.settings.barnes_hut.unwrap(),
    );
    let kr = layout.settings.kr;
    let (node_size, krprime) = unsafe { layout.settings.prevent_overlapping.unwrap_unchecked() };
    izip!(
        particles.into_iter(),
        layout.speeds.iter_mut(),
        layout.masses.iter()
    )
    .for_each(|(particle, speed, mass)| {
        let nbody_barnes_hut::vector_3d::Vector3D { x, y, z } =
            tree.calc_forces_on_particle(particle.position, mass + 1., |d2, m1, dv, m2| {
                let d = d2.sqrt();
                let dprime = d - node_size;
                (if dprime.positive() {
                    kr / dprime
                } else if dprime.is_zero() {
                    return nbody_barnes_hut::vector_3d::Vector3D {
                        x: 0.0,
                        y: 0.0,
                        z: 0.0,
                    };
                } else {
                    krprime
                }) * m1
                    * m2
                    / d
                    * dv
            });
        speed[0] -= x;
        speed[1] -= y;
        speed[2] -= z;
    });
}
