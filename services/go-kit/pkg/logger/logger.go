package logger

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

// New configures a structured zerolog logger with sane defaults for microservices.
func New(component string) zerolog.Logger {
	level := zerolog.InfoLevel
	if env := strings.ToLower(os.Getenv("LOG_LEVEL")); env != "" {
		if parsed, err := zerolog.ParseLevel(env); err == nil {
			level = parsed
		}
	}

	zerolog.TimeFieldFormat = time.RFC3339Nano

	return zerolog.New(os.Stdout).
		Level(level).
		With().
		Timestamp().
		Str("component", component).
		Logger()
}
