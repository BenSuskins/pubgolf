package httpapi

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"
)

//go:embed openapi.json
var specification embed.FS

type Options struct {
	Origins   []string
	Metrics   http.Handler
	Heartbeat time.Duration
}
type server struct {
	service *application.Service
	options Options
}

func New(service *application.Service, options Options) http.Handler {
	if options.Heartbeat == 0 {
		options.Heartbeat = 15 * time.Second
	}
	server := &server{service, options}
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
	router.HandleFunc("GET /api/v1/config/routes", func(writer http.ResponseWriter, request *http.Request) {
		write(writer, 200, map[string]any{"holes": holesResponse(domain.DefaultCourse())})
	})
	router.HandleFunc("GET /api/v1/config/randomise-options", func(writer http.ResponseWriter, request *http.Request) {
		options := []any{}
		for _, outcome := range domain.Outcomes() {
			options = append(options, map[string]any{"option": outcome.Label, "optionSize": outcome.Weight})
		}
		write(writer, 200, map[string]any{"options": options})
	})
	router.HandleFunc("GET /api/v1/config/penalty-options", func(writer http.ResponseWriter, request *http.Request) {
		write(writer, 200, map[string]any{"penalties": []any{map[string]any{"type": "SKIP", "name": "Skip a drink", "points": 5}, map[string]any{"type": "CHUNDER", "name": "Tactical chunder", "points": 10}}})
	})
	router.HandleFunc("GET /api/v1/places/search", server.search)
	router.HandleFunc("GET /actuator/health", func(writer http.ResponseWriter, request *http.Request) {
		write(writer, 200, map[string]string{"status": "UP"})
	})
	router.HandleFunc("GET /actuator/info", func(writer http.ResponseWriter, request *http.Request) { write(writer, 200, map[string]string{}) })
	if options.Metrics != nil {
		router.Handle("GET /actuator/prometheus", options.Metrics)
	}
	router.HandleFunc("GET /v3/api-docs", func(writer http.ResponseWriter, request *http.Request) {
		data, _ := specification.ReadFile("openapi.json")
		writer.Header().Set("Content-Type", "application/json")
		writer.Write(data)
	})
	router.HandleFunc("GET /swagger-ui/index.html", func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/html; charset=utf-8")
		io.WriteString(writer, `<!doctype html><html><head><title>Pub Golf API</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/v3/api-docs',dom_id:'#swagger-ui'});</script></body></html>`)
	})
	return server.cors(router)
}
func write(writer http.ResponseWriter, status int, value any) {
	if value == nil {
		writer.WriteHeader(status)
		return
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		slog.Debug("Response interrupted", "error", err)
	}
}
func failure(writer http.ResponseWriter, err error) {
	status := 500
	message := "Something went wrong — please try again"
	var value *domain.Failure
	if errors.As(err, &value) {
		message = value.Message
		switch value.Kind {
		case domain.Invalid:
			status = 400
		case domain.NotFound:
			status = 404
		case domain.Forbidden:
			status = 403
		case domain.Conflict, domain.StaleVersion, domain.DuplicateCode:
			status = 409
		case domain.Unavailable:
			status = 503
		}
	}
	if status == 500 {
		slog.Error("Request failed", "error", err)
	}
	write(writer, status, map[string]string{"message": message})
}
func body(writer http.ResponseWriter, request *http.Request, value any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 1<<20))
	if err := decoder.Decode(value); err != nil {
		write(writer, 400, map[string]string{"message": "Malformed request body"})
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		write(writer, 400, map[string]string{"message": "Malformed request body"})
		return false
	}
	return true
}
func actor(writer http.ResponseWriter, request *http.Request) (string, bool) {
	identifier := request.Header.Get("PubGolf-Player-Id")
	if identifier == "" {
		write(writer, 401, map[string]string{"message": "Missing required header: PubGolf-Player-Id"})
		return "", false
	}
	if !validUUID(identifier) {
		write(writer, 401, map[string]string{"message": "Invalid player ID format in header: " + identifier})
		return "", false
	}
	return strings.ToLower(identifier), true
}
func validUUID(value string) bool {
	if len(value) != 36 {
		return false
	}
	for index, char := range value {
		if index == 8 || index == 13 || index == 18 || index == 23 {
			if char != '-' {
				return false
			}
		} else if !strings.ContainsRune("0123456789abcdefABCDEF", char) {
			return false
		}
	}
	return true
}
func (server *server) create(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Host *string `json:"host"`
	}
	if !body(writer, request, &input) {
		return
	}
	if input.Host == nil {
		write(writer, 400, map[string]string{"message": "Malformed request body"})
		return
	}
	game, err := server.service.Create(request.Context(), *input.Host)
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 201, identityResponse(game, game.Players[0]))
}
func (server *server) join(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Name   *string `json:"name"`
		Rejoin bool    `json:"rejoin"`
	}
	if !body(writer, request, &input) {
		return
	}
	if input.Name == nil {
		write(writer, 400, map[string]string{"message": "Malformed request body"})
		return
	}
	game, err := server.service.Join(request.Context(), request.PathValue("code"), *input.Name, input.Rejoin)
	if err != nil {
		failure(writer, err)
		return
	}
	for _, player := range game.Players {
		if strings.EqualFold(player.Name, *input.Name) {
			write(writer, 200, identityResponse(game, player))
			return
		}
	}
}
func (server *server) state(writer http.ResponseWriter, request *http.Request) {
	game, err := server.service.Get(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 200, stateResponse(game))
}
func (server *server) score(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Hole    *int   `json:"hole"`
		Score   *int   `json:"score"`
		Penalty string `json:"penaltyType"`
	}
	if !body(writer, request, &input) {
		return
	}
	if input.Hole == nil || input.Score == nil {
		write(writer, 400, map[string]string{"message": "Malformed request body"})
		return
	}
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	_, err := server.service.SubmitScore(request.Context(), request.PathValue("code"), identifier, *input.Hole, *input.Score, input.Penalty)
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 204, nil)
}
func (server *server) randomise(writer http.ResponseWriter, request *http.Request) {
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	game, err := server.service.Randomise(request.Context(), request.PathValue("code"), identifier)
	if err != nil {
		failure(writer, err)
		return
	}
	for _, player := range game.Players {
		if player.ID == identifier {
			write(writer, 200, randomiseResponse{player.Randomise.Hole, player.Randomise.Result})
			return
		}
	}
}
func (server *server) complete(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Status string `json:"status"`
	}
	if !body(writer, request, &input) {
		return
	}
	if input.Status != "COMPLETED" {
		failure(writer, domain.Fail(domain.Invalid, "Only a transition to COMPLETED is supported"))
		return
	}
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	game, err := server.service.Complete(request.Context(), request.PathValue("code"), identifier)
	respondGame(writer, game, err)
}
func respondGame(writer http.ResponseWriter, game domain.Game, err error) {
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 200, stateResponse(game))
}
func (server *server) events(writer http.ResponseWriter, request *http.Request) {
	events := []any{}
	for _, event := range domain.AvailableEvents() {
		events = append(events, map[string]string{"id": event.ID, "title": event.Title, "description": event.Description})
	}
	write(writer, 200, map[string]any{"events": events})
}
func (server *server) activeEvent(writer http.ResponseWriter, request *http.Request) {
	game, err := server.service.Get(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 200, map[string]any{"activeEvent": eventResponse(game.ActiveEvent)})
}
func (server *server) activateEvent(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		EventID string `json:"eventId"`
	}
	if !body(writer, request, &input) {
		return
	}
	if strings.TrimSpace(input.EventID) == "" {
		failure(writer, domain.Fail(domain.Invalid, "Validation failed: eventId: Event ID must not be blank"))
		return
	}
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	game, err := server.service.ActivateEvent(request.Context(), request.PathValue("code"), identifier, input.EventID)
	respondGame(writer, game, err)
}
func (server *server) customEvent(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if !body(writer, request, &input) {
		return
	}
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	game, err := server.service.CustomEvent(request.Context(), request.PathValue("code"), identifier, input.Title, input.Description)
	respondGame(writer, game, err)
}
func (server *server) endEvent(writer http.ResponseWriter, request *http.Request) {
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	game, err := server.service.EndEvent(request.Context(), request.PathValue("code"), identifier)
	respondGame(writer, game, err)
}
func (server *server) course(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Holes []holeResponse `json:"holes"`
	}
	if !body(writer, request, &input) {
		return
	}
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	course := make([]domain.CourseHole, 0, len(input.Holes))
	for _, hole := range input.Holes {
		course = append(course, domain.CourseHole{Hole: hole.Hole, Par: hole.Par, Drinks: []domain.Drink(hole.Drinks)})
	}
	game, err := server.service.SetCourse(request.Context(), request.PathValue("code"), identifier, course)
	respondGame(writer, game, err)
}

type pubResponse struct {
	Hole      int     `json:"hole"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func (server *server) pubs(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Pubs []pubResponse `json:"pubs"`
	}
	if !body(writer, request, &input) {
		return
	}
	identifier, ok := actor(writer, request)
	if !ok {
		return
	}
	pubs := make([]domain.Pub, 0, len(input.Pubs))
	for _, pub := range input.Pubs {
		pubs = append(pubs, domain.Pub{Name: pub.Name, Latitude: pub.Latitude, Longitude: pub.Longitude})
	}
	_, err := server.service.SetPubs(request.Context(), request.PathValue("code"), identifier, pubs)
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 201, nil)
}
func (server *server) route(writer http.ResponseWriter, request *http.Request) {
	game, err := server.service.Get(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	pubs := make([]pubResponse, 0, len(game.Pubs))
	for _, pub := range game.Pubs {
		pubs = append(pubs, pubResponse{pub.Hole, pub.Name, pub.Latitude, pub.Longitude})
	}
	var route any
	if game.Route != nil {
		route = map[string]any{"type": game.Route.Type, "coordinates": game.Route.Coordinates}
	}
	write(writer, 200, map[string]any{"pubs": pubs, "route": route})
}
func (server *server) search(writer http.ResponseWriter, request *http.Request) {
	parameters := request.URL.Query()
	if !parameters.Has("q") {
		failure(writer, domain.Fail(domain.Invalid, "Required parameter 'q' is not present."))
		return
	}
	coordinate := func(name string) (*float64, error) {
		if !parameters.Has(name) {
			return nil, nil
		}
		value, err := strconv.ParseFloat(parameters.Get(name), 64)
		if err != nil {
			return nil, domain.Fail(domain.Invalid, "Invalid value for parameter `"+name+"`")
		}
		return &value, nil
	}
	latitude, err := coordinate("lat")
	if err != nil {
		failure(writer, err)
		return
	}
	longitude, err := coordinate("lng")
	if err != nil {
		failure(writer, err)
		return
	}
	places, err := server.service.Search(request.Context(), parameters.Get("q"), latitude, longitude)
	if err != nil {
		failure(writer, err)
		return
	}
	result := []any{}
	for _, place := range places {
		result = append(result, map[string]any{"name": place.Name, "latitude": place.Latitude, "longitude": place.Longitude})
	}
	write(writer, 200, result)
}
func (server *server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		origin := request.Header.Get("Origin")
		if origin != "" {
			writer.Header().Add("Vary", "Origin")
			allowed := false
			for _, configured := range server.options.Origins {
				if origin == configured {
					allowed = true
					break
				}
			}
			if !allowed {
				write(writer, 403, map[string]string{"message": "Origin is not allowed"})
				return
			}
			writer.Header().Set("Access-Control-Allow-Origin", origin)
			writer.Header().Set("Access-Control-Allow-Credentials", "true")
			writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			writer.Header().Set("Access-Control-Allow-Headers", "Content-Type,PubGolf-Player-Id")
		}
		if request.Method == http.MethodOptions {
			writer.WriteHeader(204)
			return
		}
		next.ServeHTTP(writer, request)
	})
}
func (server *server) stream(writer http.ResponseWriter, request *http.Request) {
	game, subscription, err := server.service.Subscribe(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	defer subscription.Cancel()
	controller := http.NewResponseController(writer)
	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("X-Accel-Buffering", "no")
	send := func(game domain.Game) error {
		controller.SetWriteDeadline(time.Now().Add(10 * time.Second))
		payload, err := json.Marshal(stateResponse(game))
		if err != nil {
			return err
		}
		if _, err = fmt.Fprintf(writer, "event: game-state\ndata: %s\n\n", payload); err != nil {
			return err
		}
		return controller.Flush()
	}
	if err = send(game); err != nil {
		return
	}
	heartbeat := time.NewTicker(server.options.Heartbeat)
	defer heartbeat.Stop()
	for {
		select {
		case <-request.Context().Done():
			return
		case updated, open := <-subscription.Updates:
			if !open {
				return
			}
			if updated.Version <= game.Version {
				continue
			}
			if err = send(updated); err != nil {
				return
			}
			game = updated
		case <-heartbeat.C:
			controller.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if _, err = io.WriteString(writer, ": heartbeat\n\n"); err != nil {
				return
			}
			if err = controller.Flush(); err != nil {
				return
			}
		}
	}
}
