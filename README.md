# Pubgolf
Pubgolf Leaderboard Application.

Developed in Java 8 with Spring Boot using Spring Security for Facebook login.

Backed by H2 database which stores leaderboard data.

Users submit scores and their name is autofilled from the Facebook integration.

App runs within a Docker Container using the instructions below.

## Screenshot
![alt text](docs/pubgolf.png?raw=true "PubGolf")

## Running the App
Create Facebook App [here](https://developers.facebook.com/).

Set the apps domain on Facebook and the OAUTH Redirect URL.

Set the following env vars:

- FACEBOOK_CLIENT_ID
- FACEBOOK_CLIENT_SECRET

Build the application

```
./gradlew clean build
```

Run the docker container:

[Local App](http://localhost/)
