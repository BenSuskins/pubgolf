package httpapi

import (
	"net/http"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (server *server) configuredCourse(writer http.ResponseWriter, request *http.Request) {
	write(writer, 200, routesResponse{Holes: holesResponse(domain.DefaultCourse().Holes())})
}

func (server *server) randomiseOptions(writer http.ResponseWriter, request *http.Request) {
	options := make([]randomiseOptionResponse, 0, len(domain.WildcardOptions()))
	for _, outcome := range domain.WildcardOptions() {
		options = append(options, randomiseOptionResponse{Option: outcome.Label, OptionSize: outcome.Weight})
	}
	write(writer, 200, randomiseOptionsResponse{Options: options})
}

func (server *server) penaltyOptions(writer http.ResponseWriter, request *http.Request) {
	options := make([]penaltyOptionResponse, 0, len(domain.PenaltyOptions()))
	for _, penalty := range domain.PenaltyOptions() {
		options = append(options, penaltyOptionResponse{Type: penalty.Type, Name: penalty.Name, Points: penalty.Points})
	}
	write(writer, 200, penaltyOptionsResponse{Penalties: options})
}
