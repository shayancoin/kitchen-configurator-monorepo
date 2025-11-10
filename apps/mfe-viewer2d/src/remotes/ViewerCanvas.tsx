"use client";

import {
  composeLayers,
  createSolidLayer,
  type ComposeLayerInput
} from "@repo/compositor-client";
import { TeslaThemeProvider } from "@repo/ui-tesla";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./viewer.module.css";

const WIDTH = 640;
const HEIGHT = 360;

const buildDemoLayers = (): ComposeLayerInput[] => {
  const base = createSolidLayer(
    WIDTH,
    HEIGHT,
    [10, 14, 24, 255],
    (index, pixel) => {
      const x = index % WIDTH;
      const gradient = x / WIDTH;
      return [
        Math.min(255, pixel[0] + gradient * 80),
        Math.min(255, pixel[1] + gradient * 45),
        Math.min(255, pixel[2] + gradient * 25),
        pixel[3]
      ];
    }
  );

  const glow = createSolidLayer(
    WIDTH,
    HEIGHT,
    [232, 33, 39, 255],
    (index, pixel) => {
      const x = index % WIDTH;
      const y = Math.floor(index / WIDTH);
      const centerX = WIDTH * 0.65;
      const centerY = HEIGHT * 0.4;
      const distance =
        Math.hypot(x - centerX, y - centerY) / Math.hypot(WIDTH, HEIGHT);
      const falloff = Math.max(0, 1 - distance * 2.2);

      return [
        pixel[0],
        Math.round(pixel[1] * falloff),
        Math.round(pixel[2] * falloff),
        Math.round(255 * falloff)
      ];
    }
  );

  const shadow = createSolidLayer(
    WIDTH,
    HEIGHT,
    [0, 0, 0, 220],
    (index, pixel) => {
      const y = Math.floor(index / WIDTH);
      const fade = 1 - y / HEIGHT;
      return [pixel[0], pixel[1], pixel[2], Math.round(pixel[3] * fade)];
    }
  );

  return [
    {
      data: base,
      width: WIDTH,
      height: HEIGHT,
      opacity: 1,
      blendMode: "over"
    },
    {
      data: shadow,
      width: WIDTH,
      height: HEIGHT,
      opacity: 0.45,
      blendMode: "multiply"
    },
    {
      data: glow,
      width: WIDTH,
      height: HEIGHT,
      opacity: 0.65,
      blendMode: "screen"
    }
  ];
};

const ViewerCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const layers = useMemo(() => buildDemoLayers(), []);

  useEffect(() => {
    let canceled = false;
    const render = async () => {
      setStatus("loading");
      try {
        const start = performance.now();
        const imageData = await composeLayers(layers);
        const elapsed = performance.now() - start;

        if (canceled) {
          return;
        }

        const context = canvasRef.current?.getContext("2d");
        context?.putImageData(imageData, 0, 0);
        // EXTEND_AI_HERE: post-compose hook (overlay AI annotations / heatmaps).
        setDuration(elapsed);
        setStatus("ready");
      } catch (cause) {
        if (canceled) {
          return;
        }
        setStatus("error");
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    };

    render().catch((cause) => {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : String(cause));
    });

    return () => {
      canceled = true;
    };
  }, [layers]);

  return (
    <TeslaThemeProvider className={styles.viewerShell}>
      <header>
        <p className={styles.badge}>Viewer2D Remote</p>
        <h1>Photon WASM compositor</h1>
        <p>
          The Rust core blends layered RGBA buffers (O(n·pixels)) and emits ImageData
          for the canvas below. This remote mirrors the Tesla viewer shell but swaps
          DOM paint with wasm-bindgen perf.
        </p>
        {/* EXTEND_AI_HERE: swap composeLayers with WebGPU path once COOP/COEP lands. */}
      </header>
      <div className={styles.canvasFrame}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      </div>
      <div className={styles.viewerMeta}>
        <span>Status: {status}</span>
        <span>
          Compose time:{" "}
          {duration !== null ? `${duration.toFixed(2)} ms` : "pending"}
        </span>
        <span>Resolution: {WIDTH}×{HEIGHT}</span>
        {error && <span className={styles.badge}>Error: {error}</span>}
      </div>
    </TeslaThemeProvider>
  );
};

export default ViewerCanvas;
