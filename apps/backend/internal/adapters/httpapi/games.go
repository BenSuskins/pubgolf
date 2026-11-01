package httpapi

import (
	"net/http"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

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
	_, err := server.service.SubmitScore(
		request.Context(),
		request.PathValue("code"),
		identifier,
		*input.Hole,
		*input.Score,
		input.Penalty,
	)
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
