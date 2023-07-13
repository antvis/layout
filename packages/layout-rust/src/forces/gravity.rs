use crate::{layout::Layout, util::*};

use itertools::izip;

pub fn apply_gravity_force2(layout: &mut Layout) {
    let center = &layout.settings.center;
    let gf = &layout.settings.kg;
    for (mass, pos, speed) in izip!(
        layout.masses.iter(),
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {
        for ((index, speed), pos) in speed.iter_mut().enumerate().zip(pos.iter()) {
            unsafe {
                *speed -= *gf * (*pos - *center.get_unchecked(index)) / *mass;
            }
        }
    }
}

pub fn apply_gravity_fruchterman(layout: &mut Layout) {
    let center = &layout.settings.center;
    // 0.01 * k * g
    let gf = 0.01 * layout.settings.ka.clone() * layout.settings.kg.clone();
    for (pos, speed) in izip!(layout.points.iter(), layout.speeds.iter_mut()) {
        for ((index, speed), pos) in speed.iter_mut().enumerate().zip(pos.iter()) {
            unsafe { *speed -= gf.clone() * (pos.clone() - center.get_unchecked(index).clone()) };
        }
    }
}

pub fn apply_gravity_forceatlas2(layout: &mut Layout) {
    let center = &layout.settings.center;
    for (mass, pos, speed) in izip!(
        layout.masses.iter(),
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {
        let d = norm(pos);
        if d == 0.0 {
            continue;
        }
        let f = (mass.clone() + 1.0) * layout.settings.kg.clone() / d;
        for ((index, speed), pos) in speed.iter_mut().enumerate().zip(pos.iter()) {
            unsafe { *speed -= f.clone() * (pos.clone() - center.get_unchecked(index).clone()) };
        }
    }
}

pub fn apply_gravity_forceatlas2_sg(layout: &mut Layout) {
    let center = &layout.settings.center;
    for (mass, pos, speed) in izip!(
        layout.masses.iter(),
        layout.points.iter(),
        layout.speeds.iter_mut()
    ) {
        let f = (mass.clone() + 1.0) * layout.settings.kg.clone();
        for ((index, speed), pos) in speed.iter_mut().enumerate().zip(pos.iter()) {
            unsafe { *speed -= f.clone() * (pos.clone() - center.get_unchecked(index).clone()) };
        }
    }
}
