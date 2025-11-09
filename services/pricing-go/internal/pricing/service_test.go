package pricing

import (
	"context"
	"testing"
	"time"

	"github.com/parvizcorp/kitchen-configurator/services/go-kit/pkg/cache"
)

func TestEstimateProducesDeterministicTotals(t *testing.T) {
	matrix := NewMatrix(map[string]float64{"galley": 5000}, map[string]float64{"island-counter": 1200, "drawer-light": 200})
	svc := NewService(matrix, cache.NewMemoryCache(), time.Minute)

	selection := Selection{
		ConfigurationID: "cfg-1",
		Module:          "galley",
		Layout:          "l-shape",
		Finish:          "gloss",
		Currency:        "USD",
		Options: []SelectionOption{
			{ID: "island-counter", Quantity: 1},
			{ID: "drawer-light", Quantity: 3},
		},
	}

	resp, err := svc.Estimate(context.Background(), selection)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expectedSubtotal := 5000 + 1200 + 3*200
	if resp.Subtotal != expectedSubtotal {
		t.Fatalf("unexpected subtotal: got %v want %v", resp.Subtotal, expectedSubtotal)
	}
	if resp.Total <= resp.Subtotal {
		t.Fatalf("expected adjustments to lift total")
	}
	if resp.Cached {
		t.Fatalf("first call should not be cached")
	}

	resp2, err := svc.Estimate(context.Background(), selection)
	if err != nil {
		t.Fatalf("unexpected error on cache hit: %v", err)
	}
	if !resp2.Cached {
		t.Fatalf("expected cached response on second call")
	}
	if resp2.Total != resp.Total {
		t.Fatalf("cached total mismatch: %v vs %v", resp2.Total, resp.Total)
	}
}

func TestSelectionCacheKeyIgnoresOrder(t *testing.T) {
	selectionA := Selection{
		Module:   "galley",
		Layout:   "u-shape",
		Finish:   "matte",
		Currency: "USD",
		Options: []SelectionOption{
			{ID: "a", Quantity: 2},
			{ID: "b", Quantity: 1},
		},
	}

	selectionB := Selection{
		Module:   "galley",
		Layout:   "u-shape",
		Finish:   "matte",
		Currency: "USD",
		Options: []SelectionOption{
			{ID: "b", Quantity: 1},
			{ID: "a", Quantity: 2},
		},
	}

	if selectionA.cacheKey() != selectionB.cacheKey() {
		t.Fatalf("expected cache keys to match regardless of option order")
	}
}
