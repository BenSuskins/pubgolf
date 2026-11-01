package httpapi

import (
	"embed"
	"io"
	"net/http"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

//go:embed openapi.json
var specification embed.FS

type Options struct {
	Origins   []string
	Metrics   http.Handler
	Heartbeat time.Duration
}
type server struct {
	commands      *application.GameCommands
	queries       *application.GameQueries
	subscriptions *application.GameSubscriptions
	places        *application.PlaceSearch
	options       Options
}

func New(games application.GameApplication, places *application.PlaceSearch, options Options) http.Handler {
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
	router.HandleFunc("POST /api/v1/games", server.create)
	router.HandleFunc("POST /api/v1/games/{code}/players", server.join)
	router.HandleFunc("GET /api/v1/games/{code}", server.state)
	router.HandleFunc("POST /api/v1/games/{code}/scores", server.score)
	router.HandleFunc("POST /api/v1/games/{code}/randomise", server.randomise)
	router.HandleFunc("PATCH /api/v1/games/{code}", server.complete)
	router.HandleFunc("GET /api/v1/games/{code}/events", server.events)
	router.HandleFunc("GET /api/v1/games/{code}/events/active", server.activeEvent)
	router.HandleFunc("PUT /api/v1/games/{code}/active-event", server.activateEvent)
	router.HandleFunc("PUT /api/v1/games/{code}/active-event/custom", server.customEvent)
	router.HandleFunc("DELETE /api/v1/games/{code}/active-event", server.endEvent)
	router.HandleFunc("PUT /api/v1/games/{code}/holes", server.course)
	router.HandleFunc("PUT /api/v1/games/{code}/pubs", server.pubs)
	router.HandleFunc("GET /api/v1/games/{code}/route", server.route)
	router.HandleFunc("GET /api/v1/games/{code}/stream", server.stream)
	server.registerConfiguration(router)
	server.registerOperations(router)
	return server.cors(router)
}

func (server *server) registerConfiguration(router *http.ServeMux) {
	router.HandleFunc("GET /api/v1/config/routes", func(writer http.ResponseWriter, request *http.Request) {
		write(writer, 200, routesResponse{Holes: holesResponse(domain.DefaultCourse().Holes())})
	})
	router.HandleFunc("GET /api/v1/config/randomise-options", func(writer http.ResponseWriter, request *http.Request) {
		options := make([]randomiseOptionResponse, 0, len(domain.RandomiseOptions()))
		for _, outcome := range domain.RandomiseOptions() {
			options = append(options, randomiseOptionResponse{Option: outcome.Label, OptionSize: outcome.Weight})
		}
		write(writer, 200, randomiseOptionsResponse{Options: options})
	})
	router.HandleFunc("GET /api/v1/config/penalty-options", func(writer http.ResponseWriter, request *http.Request) {
		write(writer, 200, penaltyOptionsResponse{Penalties: []penaltyOptionResponse{
			{Type: "SKIP", Name: "Skip a drink", Points: 5},
			{Type: "CHUNDER", Name: "Tactical chunder", Points: 10},
		}})
	})
}

func (server *server) registerOperations(router *http.ServeMux) {
	router.HandleFunc("GET /api/v1/places/search", server.search)
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
