package rules

import (
	"context"
	"testing"
	"time"

	"github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/cache"
)

func TestEngineDetectsLayoutRequirements(t *testing.T) {
	engine := NewEngine(cache.NewMemoryCache(), time.Minute)

	selection := Selection{
		ConfigurationID: "cfg",
		Module:          "galley",
		Layout:          "linear",
		Finish:          "matte",
		Dimensions:      Dimensions{LengthMM: 4200, HeightMM: 900},
		Options: []SelectionOption{
			{ID: "island-counter", Quantity: 1},
		},
	}

	res, err := engine.Validate(context.Background(), selection)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(res.Violations) == 0 {
		t.Fatalf("expected violation when option constrained to island layout")
	}
	if !res.Blocking {
		t.Fatalf("layout violation should be blocking")
	}

	res2, err := engine.Validate(context.Background(), selection)
	if err != nil {
		t.Fatalf("unexpected error on cache hit: %v", err)
	}
	if !res2.Cached {
		t.Fatalf("expected cached result on second invocation")
	}
}

func TestDimensionBandRule(t *testing.T) {
	engine := NewEngine(cache.NewMemoryCache(), time.Minute)
	selection := Selection{
		ConfigurationID: "cfg",
		Module:          "galley",
		Layout:          "u-shape",
		Finish:          "matte",
		Dimensions:      Dimensions{LengthMM: 2000, HeightMM: 900},
	}

	res, err := engine.Validate(context.Background(), selection)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(res.Violations) == 0 {
		// 2000mm < 3600mm min -> violation expected
		t.Fatalf("dimension violation expected for undersized u-shape")
	}
}
