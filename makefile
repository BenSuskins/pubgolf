.PHONY: backend backend-test frontend setup

setup:
	./gradlew clean build
	cd apps/frontend && bun install

backend:
	./gradlew apps:backend:bootRun --args='--spring.profiles.active=local'

backend-test:
	./gradlew test

frontend:
	cd apps/frontend && bun run dev
