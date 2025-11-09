package cache

import (
	"context"
	"testing"
	"time"
)

func TestMemoryCacheGetSet(t *testing.T) {
	cache := NewMemoryCache()
	ctx := context.Background()
	if err := cache.Set(ctx, "key", "value", time.Millisecond*10); err != nil {
		t.Fatalf("set failed: %v", err)
	}

	val, err := cache.Get(ctx, "key")
	if err != nil {
		t.Fatalf("get failed: %v", err)
	}
	if val != "value" {
		t.Fatalf("expected value, got %s", val)
	}

	time.Sleep(15 * time.Millisecond)
	if _, err := cache.Get(ctx, "key"); err == nil {
		t.Fatalf("expected cache miss after expiration")
	}
}
