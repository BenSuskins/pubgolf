package httpapi

import (
	"embed"
	"io"
	"net/http"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
)

//go:embed openapi.json
var specification embed.FS

type Options struct {
	Origins   []string
	Metrics   http.Handler
	Heartbeat time.Duration
}
type server struct {
	commands      *application.RoundCommands
	queries       *application.RoundQueries
	subscriptions *application.RoundSubscriptions
	places        *application.PlaceSearch
	options       Options
}

func New(games application.RoundApplication, places *application.PlaceSearch, options Options) http.Handler {
	if options.Heartbeat == 0 {
		options.Heartbeat = 15 * time.Second
	}
	server := &server{
		commands:      games.Commands,
		queries:       games.Queries,
		subscriptions: games.Subscriptions,
		places:        places,
		options:       options,
	}
	router := http.NewServeMux()
	for _, endpoint := range server.endpoints() {
		router.HandleFunc(endpoint.pattern, endpoint.handler)
	}
	server.registerOperations(router)
	return server.cors(router)
}

func (server *server) registerOperations(router *http.ServeMux) {
	router.HandleFunc("GET /actuator/health", func(writer http.ResponseWriter, request *http.Request) {
		write(writer, 200, healthResponse{Status: "UP"})
	})
	router.HandleFunc(
		"GET /actuator/info",
		func(writer http.ResponseWriter, request *http.Request) { write(writer, 200, infoResponse{}) },
	)
	if server.options.Metrics != nil {
		router.Handle("GET /actuator/prometheus", server.options.Metrics)
	}
	router.HandleFunc("GET /v3/api-docs", func(writer http.ResponseWriter, request *http.Request) {
		data, _ := specification.ReadFile("openapi.json")
		writer.Header().Set("Content-Type", "application/json")
		writer.Write(data)
	})
	router.HandleFunc("GET /swagger-ui/index.html", func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/html; charset=utf-8")
		io.WriteString(
			writer,
			`<!doctype html><html><head><title>Pub Golf API</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/v3/api-docs',dom_id:'#swagger-ui'});</script></body></html>`,
		)
	})
}
