//! Fornjot-backed helpers for constructing kitchen modules.

use fj::core::{
    operations::{
        build::{BuildRegion, BuildSketch},
        sweep::SweepSketch,
        update::UpdateSketch,
    },
    topology::{Region, Sketch, Solid},
    Core,
};
use fj_math::{Scalar, Vector};
use serde::{Deserialize, Serialize};

const MDF_DENSITY_KG_PER_MM3: f64 = 7.0e-7;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct CabinetParams {
    pub width_mm: f64,
    pub height_mm: f64,
    pub depth_mm: f64,
    pub thickness_mm: f64,
}

impl CabinetParams {
    pub fn plan_area_mm2(&self) -> f64 {
        self.width_mm * self.depth_mm
    }

    pub fn volume_mm3(&self) -> f64 {
        self.width_mm * self.depth_mm * self.height_mm
    }

    pub fn estimated_mass_kg(&self) -> f64 {
        self.volume_mm3() * MDF_DENSITY_KG_PER_MM3
    }
}

#[derive(Debug)]
pub struct ModuleSolid {
    pub solid: Solid,
    pub metrics: ModuleMetrics,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ModuleMetrics {
    pub plan_area_mm2: f64,
    pub volume_mm3: f64,
    pub estimated_mass_kg: f64,
}

impl From<&CabinetParams> for ModuleMetrics {
    fn from(params: &CabinetParams) -> Self {
        Self {
            plan_area_mm2: params.plan_area_mm2(),
            volume_mm3: params.volume_mm3(),
            estimated_mass_kg: params.estimated_mass_kg(),
        }
    }
}

pub fn build_rectangular_module(params: CabinetParams) -> ModuleSolid {
    let mut core = Core::new();
    let solid = cuboid(&mut core, params.width_mm, params.depth_mm, params.height_mm);
    ModuleSolid {
        solid,
        metrics: ModuleMetrics::from(&params),
    }
}

fn cuboid(core: &mut Core, width: f64, depth: f64, height: f64) -> Solid {
    let width = Scalar::from_f64(width);
    let depth = Scalar::from_f64(depth);
    let height = Scalar::from_f64(height);
    let bottom_surface = core.layers.topology.surfaces.xy_plane();
    let sweep_path = Vector::from([
        Scalar::ZERO,
        Scalar::ZERO,
        -height,
    ]);

    let region = Region::polygon(
        [
            [-width / 2., -depth / 2.],
            [width / 2., -depth / 2.],
            [width / 2., depth / 2.],
            [-width / 2., depth / 2.],
        ],
        core.layers.topology.surfaces.space_2d(),
        core,
    );

    Sketch::empty(&core.layers.topology)
        .add_regions([region], core)
        .sweep_sketch(bottom_surface, sweep_path, core)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn volume_matches_params() {
        let params = CabinetParams {
            width_mm: 900.0,
            height_mm: 760.0,
            depth_mm: 600.0,
            thickness_mm: 19.0,
        };
        let module = build_rectangular_module(params);
        assert!((module.metrics.volume_mm3 - params.volume_mm3()).abs() < 1.0);
    }
}
