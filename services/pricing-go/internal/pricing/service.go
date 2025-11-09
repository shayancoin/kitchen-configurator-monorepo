package pricing

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/cache"
)

// Service exposes concurrency-safe price estimation.
type Service struct {
	matrix *Matrix
	cache  cache.Cache
	ttl    time.Duration
}

// NewService wires dependencies and returns a ready-to-use Service.
func NewService(matrix *Matrix, cache cache.Cache, ttl time.Duration) *Service {
	return &Service{matrix: matrix, cache: cache, ttl: ttl}
}

// Estimate computes totals with O(n) cost where n is the number of options.
func (s *Service) Estimate(ctx context.Context, sel Selection) (EstimateResponse, error) {
	if sel.Currency == "" {
		sel.Currency = "USD"
	}
	if err := sel.Validate(); err != nil {
		return EstimateResponse{}, err
	}

	start := time.Now()

	if s.cache != nil {
		if cached, ok := s.readFromCache(ctx, sel); ok {
			cached.LatencyMicros = time.Since(start).Microseconds()
			cached.Cached = true
			return cached, nil
		}
	}

	subtotal := s.matrix.ModuleBase(sel.Module)
	for _, opt := range sel.Options {
		qty := opt.Quantity
		if qty <= 0 {
			qty = 1
		}
		subtotal += s.matrix.OptionAdder(opt.ID) * float64(qty)
	}

	adjustments := make([]EstimateAdjustment, 0, 3)
	total := subtotal

	if sel.Layout != "" {
		mult := s.matrix.LayoutMultiplier(sel.Layout)
		if mult != 1 {
			delta := subtotal * (mult - 1)
			total += delta
			adjustments = append(adjustments, EstimateAdjustment{
				Reason: fmt.Sprintf("layout:%s", sel.Layout),
				Amount: round(delta),
			})
		}
	}

	if sel.Finish != "" {
		mult := s.matrix.FinishMultiplier(sel.Finish)
		if mult != 1 {
			delta := total * (mult - 1)
			total += delta
			adjustments = append(adjustments, EstimateAdjustment{
				Reason: fmt.Sprintf("finish:%s", sel.Finish),
				Amount: round(delta),
			})
		}
	}

	if disc := volumeMultiplier(len(sel.Options)); disc != 1 {
		delta := total * (disc - 1)
		total += delta
		adjustments = append(adjustments, EstimateAdjustment{
			Reason: fmt.Sprintf("bundle:%d-options", len(sel.Options)),
			Amount: round(delta),
		})
	}

	resp := EstimateResponse{
		ConfigurationID: sel.ConfigurationID,
		Currency:        sel.Currency,
		Subtotal:        round(subtotal),
		Adjustments:     adjustments,
		Total:           round(total),
		LatencyMicros:   time.Since(start).Microseconds(),
	}

	if s.cache != nil && s.ttl > 0 {
		if payload, err := json.Marshal(resp); err == nil {
			_ = s.cache.Set(ctx, sel.cacheKey(), string(payload), s.ttl)
		}
	}

	return resp, nil
}

func (s *Service) readFromCache(ctx context.Context, sel Selection) (EstimateResponse, bool) {
	raw, err := s.cache.Get(ctx, sel.cacheKey())
	if err != nil {
		return EstimateResponse{}, false
	}
	var resp EstimateResponse
	if err := json.Unmarshal([]byte(raw), &resp); err != nil {
		return EstimateResponse{}, false
	}
	return resp, true
}

func volumeMultiplier(options int) float64 {
	switch {
	case options >= 8:
		return 0.94
	case options >= 5:
		return 0.97
	default:
		return 1
	}
}

func round(v float64) float64 {
	return math.Round(v*100) / 100
}
