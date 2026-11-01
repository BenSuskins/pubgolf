package httpapi

import (
	"net/http"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (server *server) course(writer http.ResponseWriter, request *http.Request) {
	var input setCourseRequest
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

func (server *server) pubs(writer http.ResponseWriter, request *http.Request) {
	var input setPubsRequest
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
	var route *geometryResponse
	if game.Route != nil {
		route = &geometryResponse{Type: game.Route.Type, Coordinates: game.Route.Coordinates}
	}
	write(writer, 200, routeResponse{Pubs: pubs, Route: route})
}
