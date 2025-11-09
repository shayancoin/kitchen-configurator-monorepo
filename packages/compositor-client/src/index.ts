type BlendMode = "over" | "multiply" | "screen" | "add";

export type ComposeLayerInput = {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly opacity?: number;
  readonly blendMode?: BlendMode;
};

type CompositorModule = typeof import("@repo/compositor-wasm");

let compositorPromise: Promise<CompositorModule> | undefined;

export const loadCompositor = (): Promise<CompositorModule> => {
  if (!compositorPromise) {
    compositorPromise = import("@repo/compositor-wasm");
  }
  return compositorPromise;
};

export const composeLayers = async (
  layers: ComposeLayerInput[]
): Promise<ImageData> => {
  const wasm = await loadCompositor();

  return wasm.compose_layers(
    layers.map((layer) => ({
      data: layer.data,
      width: layer.width,
      height: layer.height,
      opacity: layer.opacity ?? 1,
      blend_mode: layer.blendMode ?? "over"
    }))
  );
};

export const createSolidLayer = (
  width: number,
  height: number,
  color: [number, number, number, number],
  transformPixel?: (index: number, rgba: [number, number, number, number]) => [
    number,
    number,
    number,
    number
  ]
): Uint8Array => {
  const buffer = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    let pixelColor: [number, number, number, number] = [...color];
    if (transformPixel) {
      pixelColor = transformPixel(i, pixelColor);
    }

    buffer[offset] = pixelColor[0];
    buffer[offset + 1] = pixelColor[1];
    buffer[offset + 2] = pixelColor[2];
    buffer[offset + 3] = pixelColor[3];
  }
  return buffer;
};
