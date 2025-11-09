package logger

import (
	"os"
	"strings"
	"testing"
)

func TestNewHonorsLogLevel(t *testing.T) {
	old := os.Getenv("LOG_LEVEL")
	t.Cleanup(func() {
		os.Setenv("LOG_LEVEL", old)
	})

	cases := []string{"debug", "warn", "error"}
	for _, lvl := range cases {
		os.Setenv("LOG_LEVEL", lvl)
		logger := New("test")
		if got := strings.ToUpper(logger.GetLevel().String()); got != strings.ToUpper(lvl) {
			t.Fatalf("expected level %s, got %s", lvl, got)
		}
	}
}
