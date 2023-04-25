pub mod attraction;
pub mod gravity;
pub mod repulsion;

use crate::{
    layout::{Layout, Settings, LayoutType},
    util::*,
};

#[doc(hidden)]
pub trait Attraction<T: Coord + std::fmt::Debug> {
    fn choose_attraction(settings: &Settings<T>) -> fn(&mut Layout<T>);
}

#[doc(hidden)]
pub trait Repulsion<T: Coord + std::fmt::Debug> {
    fn choose_repulsion(settings: &Settings<T>) -> fn(&mut Layout<T>);
}

impl<T> Attraction<T> for Layout<T>
where
    T: Copy + Coord + std::fmt::Debug,
{
    #[allow(clippy::collapsible_else_if)]
    fn choose_attraction(settings: &Settings<T>) -> fn(&mut Layout<T>) {
        match settings.name {
            LayoutType::Fruchterman => match settings.dimensions {
                3 => attraction::apply_attraction_fruchterman_2d,
                _ => attraction::apply_attraction_fruchterman_2d,
            },
            LayoutType::Force2 => match settings.dimensions {
                3 => attraction::apply_attraction_force2_2d,
                _ => attraction::apply_attraction_force2_2d,
            },
            LayoutType::ForceAtlas2 => {
                if settings.prevent_overlapping.is_some() {
                    if settings.lin_log {
                        if settings.dissuade_hubs {
                            attraction::apply_attraction_forceatlas2_dh_log_po
                        } else {
                            attraction::apply_attraction_forceatlas2_log_po
                        }
                    } else {
                        if settings.dissuade_hubs {
                            attraction::apply_attraction_forceatlas2_dh_po
                        } else {
                            attraction::apply_attraction_forceatlas2_po
                        }
                    }
                } else {
                    if settings.lin_log {
                        if settings.dissuade_hubs {
                            attraction::apply_attraction_forceatlas2_dh_log
                        } else {
                            attraction::apply_attraction_forceatlas2_log
                        }
                    } else {
                        if settings.dissuade_hubs {
                            attraction::apply_attraction_forceatlas2_dh
                        } else {
                            match settings.dimensions {
                                3 => attraction::apply_attraction_forceatlas2_3d,
                                _ => attraction::apply_attraction_forceatlas2_2d,
                            }
                        }
                    }
                }
            }
        }
    }
}

pub fn choose_gravity<T: Coord + std::fmt::Debug>(settings: &Settings<T>) -> fn(&mut Layout<T>) {
    match settings.name {
        LayoutType::Fruchterman => gravity::apply_gravity_fruchterman,
        LayoutType::Force2 => gravity::apply_gravity_force2,
        LayoutType::ForceAtlas2 => {
            if settings.kg.is_zero() {
                return |_| {};
            }
            if settings.strong_gravity {
                gravity::apply_gravity_forceatlas2_sg
            } else {
                gravity::apply_gravity_forceatlas2
            }
        }
    }
}

impl Repulsion<f32> for Layout<f32> {
    fn choose_repulsion(settings: &Settings<f32>) -> fn(&mut Layout<f32>) {
        match settings.name {
            LayoutType::Fruchterman => {
                match settings.dimensions {
                    3 => {
                        return repulsion::apply_repulsion_fruchterman_2d_parallel;
                    }
                    _ => {
                        return repulsion::apply_repulsion_fruchterman_2d_parallel;
                    }
                }
            },
            LayoutType::Force2 => {
                match settings.dimensions {
                    3 => {
                        return repulsion::apply_repulsion_force2_2d_parallel;
                    }
                    _ => {
                        return repulsion::apply_repulsion_force2_2d_parallel;
                    }
                }
            },
            LayoutType::ForceAtlas2 => {
                if settings.prevent_overlapping.is_some() {
                    repulsion::apply_repulsion_forceatlas2_po
                } else {
                    match settings.dimensions {
                        3 => {
                            return repulsion::apply_repulsion_forceatlas2_3d_parallel;
                        }
                        _ => {
                            return repulsion::apply_repulsion_forceatlas2_2d_parallel;
                        }
                    }
                }
            }
        }
    }
}
