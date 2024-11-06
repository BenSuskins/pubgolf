# Pubgolf
Pubgolf Leaderboard Application.

Developed in Kotlin with Spring Boot.

Backed by H2 database which stores leaderboard data.

Users submit scores and their name is autofilled from Local Storage.

App runs within a Docker Container using the instructions below.

## Running the App
Build the application

```
./gradlew clean build
```

Build and run the docker container on port 8080:

```
./run.sh
```
