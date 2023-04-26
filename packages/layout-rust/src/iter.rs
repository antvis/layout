use crate::{layout::Layout, util::*};

use std::marker::PhantomData;

pub use parallel::*;

pub struct Node<'a, T: Coord> {
    #[cfg(test)]
    pub ind: usize,
    pub mass: &'a T,
    pub n2_iter: NodeIter2<'a, T>,
    pub pos: &'a [T],
    pub speed: &'a mut [T],
}

pub struct NodeIter<'a, T: Coord> {
    pub ind: usize,
    pub(crate) layout: SendPtr<Layout<T>>,
    pub offset: usize,
    pub(crate) _phantom: PhantomData<&'a mut Layout<T>>,
}

pub struct Node2<'a, T: Coord> {
    #[cfg(test)]
    pub ind: usize,
    pub mass: &'a T,
    pub pos: &'a [T],
    pub speed: &'a mut [T],
}

pub struct NodeIter2<'a, T: Coord> {
    pub ind: usize,
    pub(crate) layout: SendPtr<Layout<T>>,
    pub offset: usize,
    pub(crate) _phantom: PhantomData<&'a mut Layout<T>>,
}

impl<'a, T: Coord> Iterator for NodeIter<'a, T> {
    type Item = Node<'a, T>;

    fn next(&mut self) -> Option<Self::Item> {
        let layout = unsafe { self.layout.0.as_mut() };
        if let Some(mass) = layout.masses.get(self.ind) {
            Some({
                let next_offset = self.offset + layout.settings.dimensions;
                let next_ind = self.ind + 1;
                let ret = Node {
                    #[cfg(test)]
                    ind: self.ind,
                    mass,
                    n2_iter: NodeIter2 {
                        ind: next_ind,
                        layout: self.layout,
                        offset: next_offset,
                        _phantom: PhantomData::default(),
                    },
                    pos: unsafe { layout.points.points.get_unchecked(self.offset..next_offset) },
                    speed: unsafe {
                        self.layout
                            .0
                            .as_mut()
                            .speeds
                            .points
                            .get_unchecked_mut(self.offset..next_offset)
                    },
                };
                self.offset = next_offset;
                self.ind = next_ind;
                ret
            })
        } else {
            None
        }
    }
}

impl<'a, T: Coord> Iterator for NodeIter2<'a, T> {
    type Item = Node2<'a, T>;

    fn next(&mut self) -> Option<Self::Item> {
        let layout = unsafe { self.layout.0.as_mut() };
        if let Some(mass) = layout.masses.get(self.ind) {
            Some({
                let next_offset = self.offset + layout.settings.dimensions;
                let ret = Node2 {
                    #[cfg(test)]
                    ind: self.offset / layout.settings.dimensions,
                    mass,
                    pos: unsafe { layout.points.points.get_unchecked(self.offset..next_offset) },
                    speed: unsafe {
                        self.layout
                            .0
                            .as_mut()
                            .speeds
                            .points
                            .get_unchecked_mut(self.offset..next_offset)
                    },
                };
                self.offset = next_offset;
                self.ind += 1;
                ret
            })
        } else {
            None
        }
    }
}

mod parallel {
    use super::*;

    pub struct NodePar<'a, T: Coord> {
        #[cfg(test)]
        pub ind: usize,
        pub mass: &'a T,
        pub n2_iter: NodeParIter2<'a, T>,
        pub pos: &'a [T],
        pub speed: &'a mut [T],
    }

    pub struct NodeParIter<'a, T: Coord> {
        pub end: usize,
        pub ind: usize,
        pub(crate) layout: SendPtr<Layout<T>>,
        pub n2_start: usize,
        pub n2_start_ind: usize,
        pub n2_end: usize,
        pub offset: usize,
        pub(crate) _phantom: PhantomData<&'a mut Layout<T>>,
    }

    pub struct NodePar2<'a, T: Coord> {
        #[cfg(test)]
        pub ind: usize,
        pub mass: &'a T,
        pub pos: &'a [T],
        pub speed: &'a mut [T],
    }

    pub struct NodeParIter2<'a, T: Coord> {
        pub end: usize,
        pub ind: usize,
        pub(crate) layout: SendPtr<Layout<T>>,
        pub offset: usize,
        pub(crate) _phantom: PhantomData<&'a mut Layout<T>>,
    }

    impl<'a, T: Coord> Iterator for NodeParIter<'a, T> {
        type Item = NodePar<'a, T>;

        fn next(&mut self) -> Option<Self::Item> {
            if self.offset < self.end {
                Some({
                    let layout = unsafe { self.layout.0.as_mut() };
                    let next_offset = self.offset + layout.settings.dimensions;
                    let next_ind = self.ind + 1;
                    let ret = NodePar {
                        #[cfg(test)]
                        ind: self.ind,
                        mass: unsafe { layout.masses.get_unchecked(self.ind) },
                        n2_iter: NodeParIter2 {
                            end: self.n2_end,
                            ind: self.n2_start_ind.max(next_ind),
                            layout: self.layout,
                            offset: self.n2_start.max(next_offset),
                            _phantom: PhantomData::default(),
                        },
                        pos: unsafe {
                            layout.points.points.get_unchecked(self.offset..next_offset)
                        },
                        speed: unsafe {
                            self.layout
                                .0
                                .as_mut()
                                .speeds
                                .points
                                .get_unchecked_mut(self.offset..next_offset)
                        },
                    };
                    self.offset = next_offset;
                    self.ind = next_ind;
                    ret
                })
            } else {
                None
            }
        }
    }

    impl<'a, T: Coord> Iterator for NodeParIter2<'a, T> {
        type Item = NodePar2<'a, T>;

        fn next(&mut self) -> Option<Self::Item> {
            if self.offset < self.end {
                Some({
                    let layout = unsafe { self.layout.0.as_mut() };
                    let next_offset = self.offset + layout.settings.dimensions;
                    let ret = NodePar2 {
                        #[cfg(test)]
                        ind: self.ind,
                        mass: unsafe { layout.masses.get_unchecked(self.ind) },
                        pos: unsafe {
                            layout.points.points.get_unchecked(self.offset..next_offset)
                        },
                        speed: unsafe {
                            self.layout
                                .0
                                .as_mut()
                                .speeds
                                .points
                                .get_unchecked_mut(self.offset..next_offset)
                        },
                    };
                    self.offset = next_offset;
                    self.ind += 1;
                    ret
                })
            } else {
                None
            }
        }
    }
}
