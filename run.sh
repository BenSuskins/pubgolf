#!/bin/bash

docker stop pubgolf

docker rm pubgolf

./gradlew clean build

docker build -t pubgolf .

docker run -d -p 8080:8080 -e SPRING_PROFILES_ACTIVE='prod' --name pubgolf pubgolf
