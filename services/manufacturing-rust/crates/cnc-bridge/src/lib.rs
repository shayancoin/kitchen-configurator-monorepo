//! Converts module specs into deterministic G-code via cnccoder.

use anyhow::Result;
use cnccoder::prelude::*;
use manufacturing_kernel_adapter::CabinetParams;
use serde::{Deserialize, Serialize};

const DEFAULT_FEED_MM_PER_MIN: f64 = 3500.0;

#[derive(Debug, Serialize, Deserialize)]
pub struct CncArtifacts {
    pub gcode: String,
    pub estimated_runtime_min: f64,
}

pub fn generate_program(params: &CabinetParams) -> Result<CncArtifacts> {
    let mut program = Program::new(Units::Metric, params.thickness_mm + 15.0, params.thickness_mm + 80.0);
    program.set_name("rect_cabinet_panel");
    program.add_description("Deterministic panel surfacing pass");

    let tool = Tool::cylindrical(
        Units::Metric,
        params.thickness_mm + 20.0,
        12.7,
        Direction::Clockwise,
        18000.0,
        DEFAULT_FEED_MM_PER_MIN,
    );
    let mut ctx = program.context(tool);
    ctx.append_cut(Cut::plane(
        Vector3::new(0.0, 0.0, params.thickness_mm / 2.0 + 5.0),
        Vector2::new(params.width_mm, params.depth_mm),
        0.0,
        1.0,
    ));

    let gcode = program.to_gcode()?;
    let runtime = estimate_runtime_minutes(params);
    Ok(CncArtifacts {
        gcode,
        estimated_runtime_min: runtime,
    })
}

fn estimate_runtime_minutes(params: &CabinetParams) -> f64 {
    let travel = params.plan_area_mm2().sqrt();
    travel / DEFAULT_FEED_MM_PER_MIN
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gcode_contains_toolpath() {
        let params = CabinetParams {
            width_mm: 900.0,
            height_mm: 760.0,
            depth_mm: 600.0,
            thickness_mm: 19.0,
        };
        let program = generate_program(&params).expect("gcode");
        assert!(program.gcode.contains("G1"));
    }
}
