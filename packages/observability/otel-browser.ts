import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { keys } from "./keys";

let initialized = false;

export const initializeBrowserTelemetry = async () => {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const env = keys();

  const [
    { WebTracerProvider },
    { BatchSpanProcessor },
    { OTLPTraceExporter },
    { B3Propagator },
    { registerInstrumentations },
    { FetchInstrumentation },
    { DocumentLoadInstrumentation }
  ] = await Promise.all([
    import("@opentelemetry/sdk-trace-web"),
    import("@opentelemetry/sdk-trace-base"),
    import("@opentelemetry/exporter-trace-otlp-http"),
    import("@opentelemetry/propagator-b3"),
    import("@opentelemetry/instrumentation"),
    import("@opentelemetry/instrumentation-fetch"),
    import("@opentelemetry/instrumentation-document-load")
  ]);

  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        env.NEXT_PUBLIC_OTEL_SERVICE_NAME ?? "parviz-shell-web"
    })
  });

  const exporter = new OTLPTraceExporter({
    url:
      env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ??
      env.OTEL_EXPORTER_OTLP_ENDPOINT ??
      "http://localhost:4318/v1/traces"
  });

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register({ propagator: new B3Propagator() });

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({ propagateTraceHeaderCorsUrls: [/.*/] }),
      new DocumentLoadInstrumentation()
    ]
  });

  initialized = true;
};
