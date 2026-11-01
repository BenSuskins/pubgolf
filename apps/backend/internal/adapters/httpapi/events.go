package httpapi

import (
	"net/http"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (server *server) events(writer http.ResponseWriter, request *http.Request) {
	events := make([]eventOptionResponse, 0, len(domain.AvailableEvents()))
	for _, event := range domain.AvailableEvents() {
		events = append(events, eventOptionResponse{ID: event.ID, Title: event.Title, Description: event.Description})
	}
	write(writer, 200, eventsResponse{Events: events})
}

func (server *server) activeEvent(writer http.ResponseWriter, request *http.Request) {
	game, err := server.service.Get(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 200, activeEventStateResponse{ActiveEvent: eventResponse(game.ActiveEvent)})
}

func (server *server) activateEvent(writer http.ResponseWriter, request *http.Request) {
	var input activateEventRequest
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
	var input customEventRequest
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
