# Pubgolf
Pubgolf Leaderboard Application.

Developed in Java 8 with Spring Boot using Spring Security for Facebook login.

Backed by H2 database which stores leaderboard data.

Users submit scores and their name is autofilled from the Facebook integration.

## Screenshot
![alt text](docs/pubgolf.PNG?raw=true "PubGolf")

## Running the App
Configure Facebook App.

Copy App Secret and App ID to:

```bash
\src\main\resources\application.yml
```

Build .war file:

```bash
mvn package
```

Run the docker container
```bash
docker build -t pubgolf .
docker run -p 80 pubgolf 
```

