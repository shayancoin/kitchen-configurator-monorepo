package telemetry

import (
	"context"
	"log"
	"os"
	"sync"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdkresource "go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

var (
	initOnce   sync.Once
	shutdownFn func(context.Context) error
)

// Config controls how the shared telemetry bootstrap behaves.
type Config struct {
	Endpoint    string
	ServiceName string
	Environment string
	Insecure    bool
}

// Init configures a global tracer provider + propagator for Go services.
func Init(ctx context.Context, cfg Config) func(context.Context) {
	initOnce.Do(func() {
		if cfg.Endpoint == "" {
			cfg.Endpoint = "localhost:4318"
		}
		if cfg.ServiceName == "" {
			cfg.ServiceName = "parviz-service"
		}
		if cfg.Environment == "" {
			cfg.Environment = os.Getenv("ENVIRONMENT")
		}

		clientOpts := []otlptracehttp.Option{otlptracehttp.WithEndpoint(cfg.Endpoint)}
		if cfg.Insecure {
			clientOpts = append(clientOpts, otlptracehttp.WithInsecure())
		}

		exporter, err := otlptracehttp.New(ctx, clientOpts...)
		if err != nil {
			log.Printf("telemetry exporter init failed: %v", err)
			return
		}

		resource := sdkresource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(cfg.ServiceName),
			semconv.DeploymentEnvironmentKey.String(cfg.Environment),
		)

		provider := sdktrace.NewTracerProvider(
			sdktrace.WithBatcher(exporter),
			sdktrace.WithResource(resource),
		)

		otel.SetTracerProvider(provider)
		otel.SetTextMapPropagator(propagation.TraceContext{})

		shutdownFn = provider.Shutdown
	})

	return func(ctx context.Context) {
		if shutdownFn != nil {
			if err := shutdownFn(ctx); err != nil {
				log.Printf("telemetry shutdown failed: %v", err)
			}
		}
	}
}
