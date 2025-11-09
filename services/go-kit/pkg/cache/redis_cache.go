package cache

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisConfig captures the minimal connection settings we need. Password and
// DB are optional and default to "" and 0.
type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

// NewRedisCache wires a Redis-backed cache implementation.
func NewRedisCache(cfg RedisConfig) (Cache, error) {
	if cfg.Addr == "" {
		return nil, errors.New("redis addr is required")
	}

	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &redisCache{client: client}, nil
}

type redisCache struct {
	client *redis.Client
}

func (r *redisCache) Get(ctx context.Context, key string) (string, error) {
	res, err := r.client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return "", ErrCacheMiss
		}
		return "", err
	}
	return res, nil
}

func (r *redisCache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	return r.client.Set(ctx, key, value, ttl).Err()
}

// Close releases the underlying Redis client.
func (r *redisCache) Close() error {
	return r.client.Close()
}
