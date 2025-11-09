use photon_rs::{transform, PhotonImage};
use serde::Deserialize;
use wasm_bindgen::prelude::*;
use web_sys::ImageData;

const MIN_OPACITY: f32 = 0.0;
const MAX_OPACITY: f32 = 1.0;

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[derive(Debug, Deserialize)]
struct LayerInput {
    data: Vec<u8>,
    width: u32,
    height: u32,
    #[serde(default = "default_opacity")]
    opacity: f32,
    #[serde(default)]
    blend_mode: Option<String>,
}

#[derive(Clone)]
struct LayerParams {
    pixels: Vec<u8>,
    width: u32,
    height: u32,
    opacity: f32,
    blend_mode: BlendMode,
}

#[derive(Clone, Copy)]
enum BlendMode {
    Over,
    Multiply,
    Screen,
    Add,
}

impl BlendMode {
    fn from_str(value: &str) -> Self {
        match value.to_lowercase().as_str() {
            "multiply" => BlendMode::Multiply,
            "screen" => BlendMode::Screen,
            "add" | "plus" => BlendMode::Add,
            _ => BlendMode::Over,
        }
    }
}

#[wasm_bindgen]
pub fn compose_layers(layers: JsValue) -> Result<ImageData, JsValue> {
    let parsed_layers: Vec<LayerInput> = serde_wasm_bindgen::from_value(layers)
        .map_err(|err| JsValue::from_str(&format!("Invalid layers payload: {err:?}")))?;

    if parsed_layers.is_empty() {
        return Err(JsValue::from_str(
            "compose_layers requires at least one layer",
        ));
    }

    let prepared_layers = prepare_layers(parsed_layers)?;
    let (target_width, target_height) = {
        let first = prepared_layers.first().expect("non-empty");
        (first.width, first.height)
    };

    let mut accumulator = prepared_layers[0].pixels.clone();

    for layer in prepared_layers.iter().skip(1) {
        let layer_pixels = ensure_dimensions(layer, (target_width, target_height))?;
        blend_rgba(
            &mut accumulator,
            &layer_pixels,
            layer.opacity,
            layer.blend_mode,
        );
    }

    let clamped = wasm_bindgen::Clamped(&accumulator[..]);
    ImageData::new_with_u8_clamped_array_and_sh(clamped, target_width, target_height)
        .map_err(|err| JsValue::from(err))
}

fn prepare_layers(inputs: Vec<LayerInput>) -> Result<Vec<LayerParams>, JsValue> {
    inputs
        .into_iter()
        .map(|layer| {
            if layer.data.len() != (layer.width * layer.height * 4) as usize {
                return Err(JsValue::from_str(
                    "Layer buffer does not match width*height*4",
                ));
            }

            let opacity = layer.opacity.clamp(MIN_OPACITY, MAX_OPACITY);
            let blend_mode = layer
                .blend_mode
                .as_deref()
                .map(BlendMode::from_str)
                .unwrap_or(BlendMode::Over);

            Ok(LayerParams {
                pixels: layer.data,
                width: layer.width,
                height: layer.height,
                opacity,
                blend_mode,
            })
        })
        .collect()
}

fn ensure_dimensions(layer: &LayerParams, target: (u32, u32)) -> Result<Vec<u8>, JsValue> {
    if (layer.width, layer.height) == target {
        return Ok(layer.pixels.clone());
    }

    let photon_image = PhotonImage::new(layer.pixels.clone(), layer.width, layer.height);
    let resized = transform::resize(
        &photon_image,
        target.0,
        target.1,
        transform::SamplingFilter::Nearest,
    );

    Ok(resized.get_raw_pixels())
}

fn blend_rgba(base: &mut [u8], layer: &[u8], opacity: f32, mode: BlendMode) {
    for (base_px, layer_px) in base.chunks_mut(4).zip(layer.chunks(4)) {
        blend_pixel(base_px, layer_px, opacity, mode);
    }
}

fn blend_pixel(base: &mut [u8], layer: &[u8], opacity: f32, mode: BlendMode) {
    let la = ((layer[3] as f32 / 255.0) * opacity).clamp(MIN_OPACITY, MAX_OPACITY);
    if la <= f32::EPSILON {
        return;
    }

    let ba = (base[3] as f32 / 255.0).clamp(MIN_OPACITY, MAX_OPACITY);
    let out_alpha = la + ba * (1.0 - la);

    let layer_channels = [
        layer[0] as f32 / 255.0,
        layer[1] as f32 / 255.0,
        layer[2] as f32 / 255.0,
    ];
    let base_channels = [
        base[0] as f32 / 255.0,
        base[1] as f32 / 255.0,
        base[2] as f32 / 255.0,
    ];

    for idx in 0..3 {
        let blended_layer = apply_mode(base_channels[idx], layer_channels[idx], mode);
        let numerator = blended_layer * la + base_channels[idx] * ba * (1.0 - la);
        let value = if out_alpha <= f32::EPSILON {
            0.0
        } else {
            (numerator / out_alpha).clamp(0.0, 1.0)
        };
        base[idx] = (value * 255.0).round() as u8;
    }

    base[3] = (out_alpha * 255.0).round() as u8;
}

fn apply_mode(base: f32, layer: f32, mode: BlendMode) -> f32 {
    match mode {
        BlendMode::Over => layer,
        BlendMode::Multiply => base * layer,
        BlendMode::Screen => 1.0 - (1.0 - base) * (1.0 - layer),
        BlendMode::Add => (base + layer).min(1.0),
    }
}

fn default_opacity() -> f32 {
    1.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blends_pixel_with_multiply_mode() {
        let mut base = vec![255, 128, 0, 255];
        let layer = vec![128, 255, 255, 255];
        blend_rgba(&mut base, &layer, 1.0, BlendMode::Multiply);

        assert_eq!(base[0], 128);
        assert_eq!(base[1], 128);
        assert_eq!(base[3], 255);
    }

    #[test]
    fn respects_partial_opacity() {
        let mut base = vec![0, 0, 0, 255];
        let layer = vec![255, 0, 0, 255];
        blend_rgba(&mut base, &layer, 0.5, BlendMode::Over);

        assert!(base[0] > 0 && base[0] < 255);
        assert_eq!(base[3], 255);
    }
}
