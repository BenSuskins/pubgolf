package osrm

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpjson"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type PubRouteCalculator struct {
	BaseURL, Profile string
	Client           *http.Client
}

func (calculator PubRouteCalculator) CalculatePubRoute(
	ctx context.Context,
	route domain.PubRoute,
) (domain.PubRoute, error) {
	snapshot := route.Snapshot()
	var response osrmResponse
	if err := httpjson.Get(ctx, calculator.Client, calculator.routeURL(snapshot.Pubs), &response); err != nil {
		return domain.PubRoute{}, err
	}
	if response.Code != "Ok" || len(response.Routes) == 0 {
		return route, nil
	}
	geometry := response.Routes[0].Geometry
	return domain.NewPubRoute(
		snapshot.Pubs,
		&domain.PubRouteGeometry{Type: geometry.Type, Coordinates: geometry.Coordinates},
	)
}

func (calculator PubRouteCalculator) routeURL(pubs []domain.PubSnapshot) string {
	coordinates := make([]string, 0, len(pubs))
	for _, pub := range pubs {
		coordinates = append(coordinates, fmt.Sprintf("%g,%g", pub.Longitude, pub.Latitude))
	}
	return strings.TrimRight(
		calculator.BaseURL,
		"/",
	) + "/route/v1/" + url.PathEscape(
		calculator.Profile,
	) + "/" + strings.Join(
		coordinates,
		";",
	) + "?overview=full&geometries=geojson"
}
