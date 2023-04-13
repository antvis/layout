use crate::{layout::Layout, util::*};

use itertools::izip;

pub fn apply_gravity<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
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

pub fn apply_gravity_sg<T: Coord + std::fmt::Debug>(layout: &mut Layout<T>) {
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
