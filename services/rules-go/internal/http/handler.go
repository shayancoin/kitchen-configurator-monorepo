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

	"github.com/parvizcorp/kitchen-configurator/services/rules-go/internal/rules"
)

func NewHTTPHandler(log zerolog.Logger, engine *rules.Engine) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Recoverer, middleware.Timeout(1500*time.Millisecond))
	r.Use(otelhttp.NewMiddleware("rules-go-http"))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	}))

	h := &handler{log: log, engine: engine}

	r.Get("/healthz", h.health)
	r.Post("/v1/rules/validate", h.validate)

	return r
}

type handler struct {
	log    zerolog.Logger
	engine *rules.Engine
}

func (h *handler) health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

func (h *handler) validate(w http.ResponseWriter, r *http.Request) {
	var sel rules.Selection
	if err := json.NewDecoder(r.Body).Decode(&sel); err != nil {
		h.respondErr(w, http.StatusBadRequest, "invalid payload")
		return
	}
	if sel.ConfigurationID == "" {
		sel.ConfigurationID = uuid.NewString()
	}

	ctx, cancel := context.WithTimeout(r.Context(), 1500*time.Millisecond)
	defer cancel()

	result, err := h.engine.Validate(ctx, sel)
	if err != nil {
		h.log.Warn().Err(err).Msg("rules validation failed")
		h.respondErr(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		h.log.Error().Err(err).Msg("encode response failed")
	}
}

func (h *handler) respondErr(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
