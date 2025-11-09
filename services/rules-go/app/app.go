package app

import (
	"context"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/cache"
	gologger "github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/logger"
	"github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/telemetry"
	"github.com/parvizcorp/kitchen-configurator/services/rules-go/internal/config"
	transport "github.com/parvizcorp/kitchen-configurator/services/rules-go/internal/http"
	"github.com/parvizcorp/kitchen-configurator/services/rules-go/internal/rules"
	"github.com/rs/zerolog"
)

// App hosts the HTTP server + rule engine.
type App struct {
	server            *http.Server
	shutdownTimeout   time.Duration
	log               zerolog.Logger
	telemetryShutdown func(context.Context)
}

func New() *App {
	cfg := config.Load()
	log := gologger.New("rules-go")

	telemetryShutdown := telemetry.Init(context.Background(), telemetry.Config{
		Endpoint:    cfg.OTLPEndpoint,
		ServiceName: cfg.ServiceName,
		Environment: cfg.Environment,
		Insecure:    cfg.TelemetryInsecure,
	})

	var cacheLayer cache.Cache
	if cfg.RedisAddr != "" {
		if rCache, err := cache.NewRedisCache(cache.RedisConfig{
			Addr:     cfg.RedisAddr,
			Password: cfg.RedisPassword,
			DB:       cfg.RedisDB,
		}); err == nil {
			cacheLayer = rCache
		} else {
			log.Warn().Err(err).Msg("redis disabled, falling back to memory cache")
		}
	}
	if cacheLayer == nil {
		cacheLayer = cache.NewMemoryCache()
	}

	engine := rules.NewEngine(cacheLayer, cfg.CacheTTL)
	handler := transport.NewHTTPHandler(log, engine)

	srv := &http.Server{
		Addr:         ":" + cfg.HTTPPort,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	return &App{
		server:            srv,
		shutdownTimeout:   cfg.ShutdownTimeout,
		log:               log,
		telemetryShutdown: telemetryShutdown,
	}
}

func (a *App) Run(ctx context.Context) error {
	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	defer func() {
		if a.telemetryShutdown != nil {
			tdCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			a.telemetryShutdown(tdCtx)
		}
	}()

	errCh := make(chan error, 1)
	go func() {
		a.log.Info().Str("addr", a.server.Addr).Msg("rules service listening")
		errCh <- a.server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), a.shutdownTimeout)
		defer cancel()
		a.log.Info().Msg("shutting down rules service")
		return a.server.Shutdown(shutdownCtx)
	case err := <-errCh:
		return err
	}
}
