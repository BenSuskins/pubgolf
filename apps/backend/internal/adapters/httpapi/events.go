package httpapi

import (
	"net/http"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (server *server) events(writer http.ResponseWriter, request *http.Request) {
	events := []any{}
	for _, event := range domain.AvailableEvents() {
		events = append(
			events,
			map[string]string{"id": event.ID, "title": event.Title, "description": event.Description},
		)
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
	game, err := server.service.CustomEvent(
		request.Context(),
		request.PathValue("code"),
		identifier,
		input.Title,
		input.Description,
	)
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
