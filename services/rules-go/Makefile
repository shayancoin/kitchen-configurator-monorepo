ROOT ?= $(shell git rev-parse --show-toplevel 2>/dev/null || pwd)
GO ?= $(ROOT)/.tooling/go1.22.2/bin/go

.PHONY: run test build

run:
	PATH=$(dir $(GO)):$$PATH $(GO) run ./cmd/server

build:
	PATH=$(dir $(GO)):$$PATH $(GO) build ./...

test:
	PATH=$(dir $(GO)):$$PATH $(GO) test ./...
