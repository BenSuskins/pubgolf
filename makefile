.PHONY: setup backend backend-build backend-test backend-lint frontend frontend-test frontend-lint e2e e2e-ui lint

setup:
	cd apps/backend && go mod download
	cd apps/frontend && bun install --frozen-lockfile
	cd e2e && bun install --frozen-lockfile

backend:
	cd apps/backend && go run ./cmd/pubgolf

backend-build:
	cd apps/backend && go build -o build/pubgolf ./cmd/pubgolf

backend-test:
	cd apps/backend && go test -race ./...

backend-lint:
	cd apps/backend && test -z "$$(gofmt -l cmd internal)"
	cd apps/backend && go vet ./...

frontend:
	cd apps/frontend && NEXT_PUBLIC_API_URL=http://localhost:8080 bun run dev

frontend-test:
	cd apps/frontend && bun run test

frontend-lint:
	cd apps/frontend && bun run lint

lint: backend-lint frontend-lint

e2e:
	cd e2e && bun run test

e2e-ui:
	cd e2e && bun run test:ui
