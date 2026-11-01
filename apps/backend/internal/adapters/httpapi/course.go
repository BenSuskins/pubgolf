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
	course := make([]domain.CourseHoleSnapshot, 0, len(input.Holes))
	for _, hole := range input.Holes {
		course = append(
			course,
			domain.CourseHoleSnapshot{
				Hole:   hole.Hole,
				Par:    hole.Par,
				Drinks: []domain.DrinkChoiceSnapshot(hole.Drinks),
			},
		)
	}
	game, err := server.commands.SetCourse(request.Context(), request.PathValue("code"), identifier, course)
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
	pubs := make([]domain.PubSnapshot, 0, len(input.Pubs))
	for _, pub := range input.Pubs {
		pubs = append(pubs, domain.PubSnapshot{Name: pub.Name, Latitude: pub.Latitude, Longitude: pub.Longitude})
	}
	_, err := server.commands.SetPubRoute(request.Context(), request.PathValue("code"), identifier, pubs)
	if err != nil {
		failure(writer, err)
		return
	}
	write(writer, 201, nil)
}

func (server *server) route(writer http.ResponseWriter, request *http.Request) {
	game, err := server.queries.GetGame(request.Context(), request.PathValue("code"))
	if err != nil {
		failure(writer, err)
		return
	}
	pubs := make([]pubResponse, 0, len(game.PubRoute.Pubs))
	for _, pub := range game.PubRoute.Pubs {
		pubs = append(pubs, pubResponse{pub.Hole, pub.Name, pub.Latitude, pub.Longitude})
	}
	var route *geometryResponse
	if game.PubRoute.Geometry != nil {
		route = &geometryResponse{Type: game.PubRoute.Geometry.Type, Coordinates: game.PubRoute.Geometry.Coordinates}
	}
	write(writer, 200, routeResponse{Pubs: pubs, Route: route})
}
