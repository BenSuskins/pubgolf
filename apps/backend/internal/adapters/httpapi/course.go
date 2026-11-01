package httpapi

import (
	"net/http"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

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
