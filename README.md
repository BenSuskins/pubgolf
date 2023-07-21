# Pubgolf
Pubgolf Leaderboard Application.

Developed in Kotlin with Spring Boot.

Backed by H2 database which stores leaderboard data.

Users submit scores and their name is autofilled from Local Storage.

App runs within a Docker Container using the instructions below.

## Screenshot
![alt text](docs/pubgolf.png?raw=true "PubGolf")

## Running the App
Build the application

```
./gradlew clean build
```

Build and run the docker container on port 81:

```
./run.sh
```


[Local App](http://localhost:8081)
