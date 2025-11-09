package config

import (
	"os"
	"strconv"
	"time"
)

// Config captures runtime configuration for the pricing service.
type Config struct {
	HTTPPort          string
	RedisAddr         string
	RedisPassword     string
	RedisDB           int
	CacheTTL          time.Duration
	ShutdownTimeout   time.Duration
	OTLPEndpoint      string
	TelemetryInsecure bool
	ServiceName       string
	Environment       string
}

// Load builds Config from env vars with deterministic defaults so the service
// can boot without extra setup during development.
func Load() Config {
	cfg := Config{
		HTTPPort:          valueOrDefault("HTTP_PORT", "4108"),
		RedisAddr:         os.Getenv("REDIS_ADDR"),
		RedisPassword:     os.Getenv("REDIS_PASSWORD"),
		CacheTTL:          durationOrDefault("CACHE_TTL", time.Minute*5),
		ShutdownTimeout:   durationOrDefault("SHUTDOWN_TIMEOUT", time.Second*10),
		OTLPEndpoint:      valueOrDefault("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4318"),
		TelemetryInsecure: boolOrDefault("OTEL_EXPORTER_OTLP_INSECURE", true),
		ServiceName:       valueOrDefault("OTEL_SERVICE_NAME", "pricing-go"),
		Environment:       valueOrDefault("ENVIRONMENT", "local"),
	}

	if v := os.Getenv("REDIS_DB"); v != "" {
		if db, err := strconv.Atoi(v); err == nil {
			cfg.RedisDB = db
		}
	}

	return cfg
}

func valueOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func durationOrDefault(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if parsed, err := time.ParseDuration(v); err == nil {
			return parsed
		}
	}
	return fallback
}

func boolOrDefault(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		switch v {
		case "1", "true", "TRUE", "on", "ON":
			return true
		case "0", "false", "FALSE", "off", "OFF":
			return false
		}
	}
	return fallback
}
