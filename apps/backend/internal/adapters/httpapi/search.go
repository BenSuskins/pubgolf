package httpapi

import (
	"net/http"
	"strconv"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

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
		result = append(
			result,
			map[string]any{"name": place.Name, "latitude": place.Latitude, "longitude": place.Longitude},
		)
	}
	write(writer, 200, result)
}
