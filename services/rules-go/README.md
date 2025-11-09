# Rules Service (Go)

Evaluates deterministic configuration constraints (layout/finish/dimension compatibility) and emits blocking + warning violations for the kitchen configurator.

## Quickstart
```bash
cd services/rules-go
PATH=$PWD/../../.tooling/go1.22.2/bin:$PATH go run ./cmd/server
```

### Environment
| Var | Default | Description |
| --- | --- | --- |
| `HTTP_PORT` | `4110` | HTTP bind port |
| `CACHE_TTL` | `2m` | Validation memoization TTL |
| `REDIS_ADDR` | _empty_ | Optional Redis instance for shared caches |
| `REDIS_PASSWORD` | _empty_ | Redis auth token |

### API
- `POST /v1/rules/validate`: returns violations + blocking flag. Payload mirrors `pricing` service with extra `dimensions` field.

Example response:
```json
{
  "configurationId": "cfg",
  "violations": [
    {"code": "layout.island-counter", "severity": "error", "message": "island-counter requires island layout"}
  ],
  "blocking": true,
  "latencyMicros": 512
}
```

## Tests
`PATH=$PWD/../../.tooling/go1.22.2/bin:$PATH go test ./...`
