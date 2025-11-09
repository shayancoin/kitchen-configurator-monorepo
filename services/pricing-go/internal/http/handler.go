package http

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/parvizcorp/kitchen-configurator/services/pricing-go/internal/pricing"
)

// NewHTTPHandler wires chi, middleware, and our pricing endpoints.
func NewHTTPHandler(log zerolog.Logger, svc *pricing.Service) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(2 * time.Second))
	r.Use(otelhttp.NewMiddleware("pricing-go-http"))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}))

	h := &handler{log: log, svc: svc}

	r.Get("/healthz", h.health)
	r.Post("/v1/pricing/estimate", h.estimate)

	return r
}

type handler struct {
	log zerolog.Logger
	svc *pricing.Service
}

func (h *handler) health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

func (h *handler) estimate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var payload pricing.Selection
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid payload")
		return
	}
	if payload.ConfigurationID == "" {
		payload.ConfigurationID = uuid.NewString()
	}

	// Ensure we don't hold the request open forever even if upstream callers
	// remove the middleware timeout.
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	resp, err := h.svc.Estimate(ctx, payload)
	if err != nil {
		h.log.Warn().Err(err).Msg("estimate failed")
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		h.log.Error().Err(err).Msg("failed to encode response")
	}
}

func (h *handler) respondError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
