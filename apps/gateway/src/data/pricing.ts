import crypto from "crypto";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import type { PricingQuoteDTO } from "@repo/shared-sdl";
import { getCatalogModuleById } from "./catalog";

const pct = (value: number, percentage: number) =>
  Math.round(value * percentage);

const tracer = trace.getTracer("gateway-pricing");

export const buildPricingEstimate = async (
  moduleId: string,
  finishId: string
): Promise<PricingQuoteDTO> =>
  tracer.startActiveSpan("buildPricingEstimate", async (span) => {
    span.setAttributes({ moduleId, finishId });
    try {
      const module = await getCatalogModuleById(moduleId);
      if (!module) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: "module_not_found" });
        throw new Error(`Unknown module ${moduleId}`);
      }

      const finish = module.finishes.find((item) => item.id === finishId);
      if (!finish) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: "finish_not_found" });
        throw new Error(`Unknown finish ${finishId} for module ${moduleId}`);
      }

      const subtotal = module.basePrice + finish.costDelta;
      const aiOptimizer = pct(subtotal, 0.04);
      const manufacturingBuffer = finish.leadTimeWeeks >= 12 ? 2200 : 950;

      const adjustments = [
        { label: "AI layout optimizer", amount: aiOptimizer },
        { label: "Material volatility buffer", amount: manufacturingBuffer }
      ];

      const total =
        subtotal + adjustments.reduce((sum, line) => sum + line.amount, 0);

      const quote: PricingQuoteDTO = {
        id: crypto.randomUUID(),
        moduleId: module.id,
        finishId,
        subtotal,
        adjustments,
        total,
        currency: "USD",
        leadTimeWeeks: Math.max(finish.leadTimeWeeks, 8)
      };

      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttributes({ subtotal, total });
      return quote;
    } finally {
      span.end();
    }
  });
