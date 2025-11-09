package pricing

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"sort"
	"strconv"
)

// SelectionOption captures a single option ID + quantity in the configurator.
type SelectionOption struct {
	ID       string `json:"id"`
	Quantity int    `json:"quantity"`
}

// Selection describes the incoming payload from the configurator shell.
type Selection struct {
	ConfigurationID string            `json:"configurationId"`
	Module          string            `json:"module"`
	Layout          string            `json:"layout"`
	Finish          string            `json:"finish"`
	Currency        string            `json:"currency"`
	Options         []SelectionOption `json:"options"`
}

// EstimateAdjustment captures the delta applied to reach the grand total.
type EstimateAdjustment struct {
	Reason string  `json:"reason"`
	Amount float64 `json:"amount"`
}

// EstimateResponse is returned to web clients.
type EstimateResponse struct {
	ConfigurationID string               `json:"configurationId"`
	Currency        string               `json:"currency"`
	Subtotal        float64              `json:"subtotal"`
	Adjustments     []EstimateAdjustment `json:"adjustments"`
	Total           float64              `json:"total"`
	LatencyMicros   int64                `json:"latencyMicros"`
	Cached          bool                 `json:"cached"`
}

// Validate ensures the selection payload is well-formed.
func (s Selection) Validate() error {
	if s.Module == "" {
		return errors.New("module is required")
	}
	if s.Currency == "" {
		return errors.New("currency is required")
	}
	for _, opt := range s.Options {
		if opt.ID == "" {
			return errors.New("option id is required")
		}
		if opt.Quantity < 0 {
			return errors.New("option quantity must be >= 0")
		}
	}
	return nil
}

// cacheKey collapses the selection into a deterministic SHA1 hash so we can use
// Redis efficiently even when option order differs.
func (s Selection) cacheKey() string {
	type keyOption struct {
		ID       string
		Quantity int
	}
	opts := make([]keyOption, 0, len(s.Options))
	for _, opt := range s.Options {
		opts = append(opts, keyOption{ID: opt.ID, Quantity: opt.Quantity})
	}
	sort.Slice(opts, func(i, j int) bool {
		if opts[i].ID == opts[j].ID {
			return opts[i].Quantity < opts[j].Quantity
		}
		return opts[i].ID < opts[j].ID
	})

	h := sha1.New()
	h.Write([]byte(s.Module))
	h.Write([]byte("|"))
	h.Write([]byte(s.Layout))
	h.Write([]byte("|"))
	h.Write([]byte(s.Finish))
	h.Write([]byte("|"))
	h.Write([]byte(s.Currency))
	h.Write([]byte("|"))
	for _, opt := range opts {
		h.Write([]byte(opt.ID))
		h.Write([]byte("="))
		h.Write([]byte(strconv.Itoa(opt.Quantity)))
		h.Write([]byte(";"))
	}
	return hex.EncodeToString(h.Sum(nil))
}
