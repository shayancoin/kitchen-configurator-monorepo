package cache

import (
	"context"
	"errors"
	"time"
)

// ErrCacheMiss indicates the key was not found.
var ErrCacheMiss = errors.New("cache miss")

// Cache defines the minimal surface the Go services rely on so we can
// swap Redis for in-memory implementations during tests.
type Cache interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key, value string, ttl time.Duration) error
}
