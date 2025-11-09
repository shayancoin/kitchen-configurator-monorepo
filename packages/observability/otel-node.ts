import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { keys } from "./keys";

let sdk: NodeSDK | null = null;

const parseHeaders = (raw?: string | null) => {
  if (!raw) {
    return undefined;
  }

  return raw.split(",").reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});
};

export const startNodeTelemetry = (): NodeSDK | null => {
  if (sdk) {
    return sdk;
  }

  const env = keys();

  if (env.OTEL_DEBUG) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const exporter = new OTLPTraceExporter({
    url: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318/v1/traces",
    headers: parseHeaders(env.OTEL_EXPORTER_OTLP_HEADERS)
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        env.OTEL_SERVICE_NAME ?? "parviz-gateway",
      [SemanticResourceAttributes.SERVICE_VERSION]:
        env.OTEL_SERVICE_VERSION ?? "dev"
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk
    .start()
    .then(() => {
      if (env.OTEL_DEBUG) {
        console.info("[observability] node telemetry started");
      }
    })
    .catch((error) => {
      console.error("[observability] failed to start telemetry", error);
    });

  const shutdown = () => {
    void sdk
      ?.shutdown()
      .catch((error) => console.error("[observability] shutdown failed", error));
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  return sdk;
};
