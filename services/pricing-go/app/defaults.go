package app

func defaultModulePricing() map[string]float64 {
	return map[string]float64{
		"galley":   5200,
		"luxe":     7800,
		"island":   9400,
		"compact":  3900,
		"pantry":   3100,
		"wall-run": 4600,
	}
}

func defaultOptionPricing() map[string]float64 {
	return map[string]float64{
		"appliance-panel":   850,
		"waterfall-edge":    1200,
		"glass-cabinet":     560,
		"drawer-lighting":   240,
		"pull-out-pantry":   380,
		"corner-carousel":   420,
		"drawer-organizer":  180,
		"range-upgrade":     2100,
		"cooktop-induction": 980,
		"backsplash":        300,
	}
}
