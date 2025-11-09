package rules

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"sort"
	"strconv"
)

type SelectionOption struct {
	ID       string `json:"id"`
	Quantity int    `json:"quantity"`
}

type Dimensions struct {
	LengthMM int `json:"lengthMm"`
	HeightMM int `json:"heightMm"`
}

type Selection struct {
	ConfigurationID string            `json:"configurationId"`
	Module          string            `json:"module"`
	Layout          string            `json:"layout"`
	Finish          string            `json:"finish"`
	Options         []SelectionOption `json:"options"`
	Dimensions      Dimensions        `json:"dimensions"`
}

func (s Selection) Validate() error {
	if s.Module == "" {
		return errors.New("module is required")
	}
	if s.Layout == "" {
		return errors.New("layout is required")
	}
	for _, opt := range s.Options {
		if opt.ID == "" {
			return errors.New("option id is required")
		}
	}
	return nil
}

func (s Selection) cacheKey() string {
	type keyOpt struct {
		ID       string
		Quantity int
	}
	opts := make([]keyOpt, 0, len(s.Options))
	for _, opt := range s.Options {
		opts = append(opts, keyOpt{ID: opt.ID, Quantity: opt.Quantity})
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
	h.Write([]byte(strconv.Itoa(s.Dimensions.LengthMM)))
	h.Write([]byte("x"))
	h.Write([]byte(strconv.Itoa(s.Dimensions.HeightMM)))
	h.Write([]byte("|"))
	for _, opt := range opts {
		h.Write([]byte(opt.ID))
		h.Write([]byte("="))
		h.Write([]byte(strconv.Itoa(opt.Quantity)))
		h.Write([]byte(";"))
	}
	return hex.EncodeToString(h.Sum(nil))
}

// Violation describes a single blocking or warning state.
type Violation struct {
	Code     string `json:"code"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

// ValidationResult wraps rule evaluation output.
type ValidationResult struct {
	ConfigurationID string      `json:"configurationId"`
	Violations      []Violation `json:"violations"`
	Blocking        bool        `json:"blocking"`
	LatencyMicros   int64       `json:"latencyMicros"`
	Cached          bool        `json:"cached"`
}
