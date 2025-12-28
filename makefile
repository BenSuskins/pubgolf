.PHONY: backend backend-test frontend frontend-test setup e2e e2e-ui

setup:
	./gradlew clean build
	cd apps/frontend && bun install
	cd e2e && bun install

backend:
	./gradlew apps:backend:bootRun --args='--spring.profiles.active=local'

backend-test:
	./gradlew test

frontend:
	cd apps/frontend && bun run dev

frontend-test:
	cd apps/frontend && bun run test

e2e:
	cd e2e && bun run test

e2e-ui:
	cd e2e && bun run test:ui
