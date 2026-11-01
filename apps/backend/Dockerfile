FROM golang:1.27.3-alpine AS build
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /pubgolf ./cmd/pubgolf

FROM alpine:3.23
RUN apk add --no-cache ca-certificates && addgroup -S pubgolf && adduser -S -G pubgolf pubgolf && mkdir /data && chown pubgolf:pubgolf /data
COPY --from=build /pubgolf /usr/local/bin/pubgolf
USER pubgolf
ENV PORT=8080 DATABASE_PATH=/data/pubgolf-go.db
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/actuator/health || exit 1
ENTRYPOINT ["/usr/local/bin/pubgolf"]
