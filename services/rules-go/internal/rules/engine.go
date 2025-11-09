package rules

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/cache"
)

type constraint interface {
	evaluate(sel Selection) (Violation, bool)
}

type constraintFunc func(sel Selection) (Violation, bool)

func (f constraintFunc) evaluate(sel Selection) (Violation, bool) {
	return f(sel)
}

// Engine evaluates configuration rules deterministically (O(r)) where r is the
// number of registered constraints.
type Engine struct {
	constraints []constraint
	cache       cache.Cache
	ttl         time.Duration
}

func NewEngine(cache cache.Cache, ttl time.Duration) *Engine {
	return &Engine{
		constraints: []constraint{
			requireLayoutForOption("island-counter", "island"),
			forbidOptionsForLayout("linear", []string{"corner-carousel", "pull-out-pantry"}),
			finishCompatibilityRule("glass-cabinet", []string{"gloss", "stainless"}),
			dimensionBandRule("u-shape", 3600, 9600),
			dimensionBandRule("island", 4200, 12000),
			maxApplianceRule(3),
		},
		cache: cache,
		ttl:   ttl,
	}
}

func (e *Engine) Validate(ctx context.Context, sel Selection) (ValidationResult, error) {
	if err := sel.Validate(); err != nil {
		return ValidationResult{}, err
	}

	start := time.Now()
	if e.cache != nil {
		if res, ok := e.readFromCache(ctx, sel); ok {
			res.Cached = true
			res.LatencyMicros = time.Since(start).Microseconds()
			return res, nil
		}
	}

	violations := make([]Violation, 0)
	blocking := false
	for _, c := range e.constraints {
		if violation, violated := c.evaluate(sel); violated {
			violations = append(violations, violation)
			if strings.EqualFold(violation.Severity, "error") {
				blocking = true
			}
		}
	}

	result := ValidationResult{
		ConfigurationID: sel.ConfigurationID,
		Violations:      violations,
		Blocking:        blocking,
		LatencyMicros:   time.Since(start).Microseconds(),
	}

	if e.cache != nil && e.ttl > 0 {
		if payload, err := json.Marshal(result); err == nil {
			_ = e.cache.Set(ctx, sel.cacheKey(), string(payload), e.ttl)
		}
	}

	return result, nil
}

func (e *Engine) readFromCache(ctx context.Context, sel Selection) (ValidationResult, bool) {
	raw, err := e.cache.Get(ctx, sel.cacheKey())
	if err != nil {
		return ValidationResult{}, false
	}
	var res ValidationResult
	if err := json.Unmarshal([]byte(raw), &res); err != nil {
		return ValidationResult{}, false
	}
	return res, true
}

func requireLayoutForOption(optionID, requiredLayout string) constraint {
	return constraintFunc(func(sel Selection) (Violation, bool) {
		if hasOption(sel, optionID) && sel.Layout != requiredLayout {
			return Violation{
				Code:     "layout." + optionID,
				Severity: "error",
				Message:  fmt.Sprintf("%s requires %s layout", optionID, requiredLayout),
			}, true
		}
		return Violation{}, false
	})
}

func forbidOptionsForLayout(layout string, optionIDs []string) constraint {
	set := make(map[string]struct{}, len(optionIDs))
	for _, id := range optionIDs {
		set[id] = struct{}{}
	}
	return constraintFunc(func(sel Selection) (Violation, bool) {
		if sel.Layout != layout {
			return Violation{}, false
		}
		for _, opt := range sel.Options {
			if _, ok := set[opt.ID]; ok {
				return Violation{
					Code:     "layout.blocked",
					Severity: "error",
					Message:  fmt.Sprintf("option %s is invalid for %s layout", opt.ID, layout),
				}, true
			}
		}
		return Violation{}, false
	})
}

func finishCompatibilityRule(optionID string, allowedFinishes []string) constraint {
	allowed := make(map[string]struct{}, len(allowedFinishes))
	for _, finish := range allowedFinishes {
		allowed[finish] = struct{}{}
	}
	return constraintFunc(func(sel Selection) (Violation, bool) {
		if !hasOption(sel, optionID) {
			return Violation{}, false
		}
		if _, ok := allowed[sel.Finish]; !ok {
			return Violation{
				Code:     "finish." + optionID,
				Severity: "error",
				Message:  fmt.Sprintf("%s only supports %s finishes", optionID, strings.Join(allowedFinishes, ", ")),
			}, true
		}
		return Violation{}, false
	})
}

func dimensionBandRule(layout string, min, max int) constraint {
	return constraintFunc(func(sel Selection) (Violation, bool) {
		if sel.Layout != layout {
			return Violation{}, false
		}
		length := sel.Dimensions.LengthMM
		if length == 0 {
			return Violation{}, false
		}
		if length < min || length > max {
			return Violation{
				Code:     "dimension." + layout,
				Severity: "error",
				Message:  fmt.Sprintf("layout %s requires length between %dmm and %dmm", layout, min, max),
			}, true
		}
		return Violation{}, false
	})
}

func maxApplianceRule(limit int) constraint {
	applianceOptions := []string{"appliance-panel", "range-upgrade", "cooktop-induction"}
	return constraintFunc(func(sel Selection) (Violation, bool) {
		count := 0
		for _, opt := range sel.Options {
			for _, candidate := range applianceOptions {
				if opt.ID == candidate {
					count += opt.Quantity
				}
			}
		}
		if count > limit {
			return Violation{
				Code:     "appliance.limit",
				Severity: "warning",
				Message:  fmt.Sprintf("appliance upgrades limited to %d (requested %d)", limit, count),
			}, true
		}
		return Violation{}, false
	})
}

func hasOption(sel Selection, id string) bool {
	for _, opt := range sel.Options {
		if opt.ID == id {
			return true
		}
	}
	return false
}
