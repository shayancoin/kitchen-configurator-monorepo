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
	"github.com/parvizcorp/kitchen-configurator/services/pricing-go/internal/config"
	transport "github.com/parvizcorp/kitchen-configurator/services/pricing-go/internal/http"
	"github.com/parvizcorp/kitchen-configurator/services/pricing-go/internal/pricing"
	"github.com/rs/zerolog"
)

// App wires transport + domain services and exposes a Run helper.
type App struct {
	server            *http.Server
	shutdownTimeout   time.Duration
	log               zerolog.Logger
	telemetryShutdown func(context.Context)
}

// New builds the pricing service using env configuration.
func New() *App {
	cfg := config.Load()
	log := gologger.New("pricing-go")

	telemetryShutdown := telemetry.Init(context.Background(), telemetry.Config{
		Endpoint:    cfg.OTLPEndpoint,
		ServiceName: cfg.ServiceName,
		Environment: cfg.Environment,
		Insecure:    cfg.TelemetryInsecure,
	})

	var cacheLayer cache.Cache
	if cfg.RedisAddr != "" {
		rCache, err := cache.NewRedisCache(cache.RedisConfig{
			Addr:     cfg.RedisAddr,
			Password: cfg.RedisPassword,
			DB:       cfg.RedisDB,
		})
		if err == nil {
			cacheLayer = rCache
		} else {
			log.Warn().Err(err).Msg("redis cache disabled, falling back to memory cache")
		}
	}
	if cacheLayer == nil {
		cacheLayer = cache.NewMemoryCache()
	}

	matrix := pricing.NewMatrix(defaultModulePricing(), defaultOptionPricing())
	svc := pricing.NewService(matrix, cacheLayer, cfg.CacheTTL)

	handler := transport.NewHTTPHandler(log, svc)

	srv := &http.Server{
		Addr:         ":" + cfg.HTTPPort,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 20 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return &App{
		server:            srv,
		shutdownTimeout:   cfg.ShutdownTimeout,
		log:               log,
		telemetryShutdown: telemetryShutdown,
	}
}

// Run listens for OS signals and blocks until shutdown completes.
func (a *App) Run(ctx context.Context) error {
	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	defer func() {
		if a.telemetryShutdown != nil {
			shCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			a.telemetryShutdown(shCtx)
		}
	}()

	errCh := make(chan error, 1)
	go func() {
		a.log.Info().Str("addr", a.server.Addr).Msg("pricing service listening")
		errCh <- a.server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shCtx, cancel := context.WithTimeout(context.Background(), a.shutdownTimeout)
		defer cancel()
		a.log.Info().Msg("shutting down pricing service")
		return a.server.Shutdown(shCtx)
	case err := <-errCh:
		return err
	}
}
