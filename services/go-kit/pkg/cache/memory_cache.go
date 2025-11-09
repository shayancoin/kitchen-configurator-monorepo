package cache

import (
	"context"
	"sync"
	"time"
)

type memoryEntry struct {
	value     string
	expiresAt time.Time
}

// NewMemoryCache returns an in-memory cache that is safe for concurrent use.
func NewMemoryCache() Cache {
	return &memoryCache{data: make(map[string]memoryEntry)}
}

type memoryCache struct {
	mu   sync.RWMutex
	data map[string]memoryEntry
}

func (m *memoryCache) Get(_ context.Context, key string) (string, error) {
	m.mu.RLock()
	entry, ok := m.data[key]
	m.mu.RUnlock()
	if !ok || (entry.expiresAt != (time.Time{}) && time.Now().After(entry.expiresAt)) {
		return "", ErrCacheMiss
	}
	return entry.value, nil
}

func (m *memoryCache) Set(_ context.Context, key, value string, ttl time.Duration) error {
	m.mu.Lock()
	var expires time.Time
	if ttl > 0 {
		expires = time.Now().Add(ttl)
	}
	m.data[key] = memoryEntry{value: value, expiresAt: expires}
	m.mu.Unlock()
	return nil
}
