#!/bin/bash

./gradlew clean build

docker build -t pubgolf .

docker run -d -p 8081:8080 pubgolf
