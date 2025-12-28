.PHONY: backend backend-test backend-lint frontend frontend-test frontend-lint setup e2e e2e-ui lint

setup:
	./gradlew clean build
	cd apps/frontend && bun install
	cd e2e && bun install

backend:
	./gradlew apps:backend:bootRun --args='--spring.profiles.active=local'

backend-test:
	./gradlew test

backend-lint:
	./gradlew ktlintCheck

frontend:
	cd apps/frontend && bun run dev

frontend-test:
	cd apps/frontend && bun run test

frontend-lint:
	cd apps/frontend && bun run lint

lint: backend-lint frontend-lint

e2e:
	cd e2e && bun run test

e2e-ui:
	cd e2e && bun run test:ui
