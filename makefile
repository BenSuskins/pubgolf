.PHONY: backend backend-test frontend setup

setup:
	./gradlew clean build
	cd apps/frontend && npm i

backend:
	./gradlew apps:backend:bootRun --args='--spring.profiles.active=local'

database:
	podman compose up -d db

backend-test:
	./gradlew test

frontend:
	cd apps/frontend && npm run dev