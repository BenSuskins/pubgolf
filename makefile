.PHONY: backend backend-test frontend setup

setup:
	./gradlew clean build
	cd apps/frontend && npm i

backend:
	./gradlew apps:backend:bootRun --args='--spring.profiles.active=local'

backend-test:
	./gradlew test

frontend:
	cd apps/frontend && npm run dev