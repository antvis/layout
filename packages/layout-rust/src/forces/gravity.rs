use crate::{layout::Layout, util::*};

use itertools::izip;

pub fn apply_gravity_force2<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let center = &layout.settings.center;
    let center_x = &center.0;
    let gf = layout.settings.kg.clone();
    for (mass, pos, speed) in izip!(
        layout.masses.iter(),
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {

        for (speed, pos) in speed.iter_mut().zip(pos.iter()) {
            *speed -= gf.clone() * (pos.clone() - center_x.clone()) / mass.clone();
        }
    }
}

pub fn apply_gravity_fruchterman<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    let center = &layout.settings.center;
    let center_x = &center.0;
    let gf = layout.settings.kr.clone() * layout.settings.ka.clone() * layout.settings.kg.clone();
    for (pos, speed) in izip!(
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {        
        for (speed, pos) in speed.iter_mut().zip(pos.iter()) {
            *speed -= gf.clone() * (pos.clone() - center_x.clone());
        }
    }
}

pub fn apply_gravity_forceatlas2<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (mass, pos, speed) in izip!(
        layout.masses.iter(),
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {
        let d = norm(pos);
        if d.is_zero() {
            continue;
        }
        let f = (mass.clone() + T::one()) * layout.settings.kg.clone() / d;
        for (speed, pos) in speed.iter_mut().zip(pos.iter()) {
            *speed -= f.clone() * pos.clone();
        }
    }
}

pub fn apply_gravity_forceatlas2_sg<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
    for (mass, pos, speed) in izip!(
        layout.masses.iter(),
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {
        let f = (mass.clone() + T::one()) * layout.settings.kg.clone();
        for (speed, pos) in speed.iter_mut().zip(pos.iter()) {
            *speed -= f.clone() * pos.clone();
        }
    }
}
