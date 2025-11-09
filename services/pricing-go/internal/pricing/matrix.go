package pricing

import "sync"

// Matrix hosts deterministic price tables and multipliers. All reads are
// guarded by a RWMutex so hot paths can scale across goroutines safely.
type Matrix struct {
	mu               sync.RWMutex
	moduleBase       map[string]float64
	optionAdders     map[string]float64
	layoutMultiplier map[string]float64
	finishMultiplier map[string]float64
}

// NewMatrix builds a new pricing matrix using the provided seeds. Missing maps
// fall back to empty maps so we never panic on lookups.
func NewMatrix(base map[string]float64, options map[string]float64) *Matrix {
	m := &Matrix{
		moduleBase:       make(map[string]float64),
		optionAdders:     make(map[string]float64),
		layoutMultiplier: defaultLayoutMultipliers(),
		finishMultiplier: defaultFinishMultipliers(),
	}

	for k, v := range base {
		m.moduleBase[k] = v
	}
	for k, v := range options {
		m.optionAdders[k] = v
	}

	return m
}

func defaultLayoutMultipliers() map[string]float64 {
	return map[string]float64{
		"linear":  1.0,
		"l-shape": 1.08,
		"u-shape": 1.11,
		"island":  1.16,
	}
}

func defaultFinishMultipliers() map[string]float64 {
	return map[string]float64{
		"matte":      1.0,
		"gloss":      1.04,
		"stainless":  1.08,
		"wood-grain": 1.02,
	}
}

func (m *Matrix) ModuleBase(module string) float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if v, ok := m.moduleBase[module]; ok {
		return v
	}
	return 4200.0
}

func (m *Matrix) OptionAdder(id string) float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if v, ok := m.optionAdders[id]; ok {
		return v
	}
	return 0
}

func (m *Matrix) LayoutMultiplier(layout string) float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if v, ok := m.layoutMultiplier[layout]; ok {
		return v
	}
	return 1.0
}

func (m *Matrix) FinishMultiplier(finish string) float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if v, ok := m.finishMultiplier[finish]; ok {
		return v
	}
	return 1.0
}

// UpdateOption allows background sync jobs to atomically tweak option adders.
func (m *Matrix) UpdateOption(id string, price float64) {
	m.mu.Lock()
	m.optionAdders[id] = price
	m.mu.Unlock()
}
