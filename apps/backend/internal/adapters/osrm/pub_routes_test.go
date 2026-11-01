package osrm_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/osrm"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func pubRoute(t *testing.T) domain.PubRoute {
	t.Helper()
	pubs := make([]domain.PubSnapshot, 9)
	for index := range pubs {
		pubs[index] = domain.PubSnapshot{Name: "Pub", Longitude: 0.1, Latitude: 51}
	}
	pubs[1].Longitude = 0.2
	pubs[1].Latitude = 52
	route, err := domain.NewPubRoute(pubs, nil)
	if err != nil {
		t.Fatal(err)
	}
	return route
}

func TestRoutingUsesLongitudeFirstAndReturnsNoGeometryOnNoMatch(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if !strings.Contains(request.URL.Path, "/foot/0.1,51;0.2,52") {
			t.Error(request.URL.Path)
		}
		fmt.Fprint(writer, `{"code":"NoRoute","routes":[]}`)
	}))
	defer server.Close()
	adapter := osrm.PubRouteCalculator{BaseURL: server.URL, Profile: "foot", Client: server.Client()}
	route, err := adapter.CalculatePubRoute(context.Background(), pubRoute(t))
	if err != nil || route.Snapshot().Geometry != nil || len(route.Snapshot().Pubs) != 9 {
		t.Fatal(route, err)
	}
}

func TestProviderTimeoutDoesNotBlockIndefinitely(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) { <-request.Context().Done() }),
	)
	defer server.Close()
	client := server.Client()
	client.Timeout = 20 * time.Millisecond
	adapter := osrm.PubRouteCalculator{BaseURL: server.URL, Profile: "foot", Client: client}
	if _, err := adapter.CalculatePubRoute(context.Background(), pubRoute(t)); err == nil {
		t.Fatal("upstream timeout ignored")
	}
}

func TestCalculatedGeometryPreservesPubOrder(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		fmt.Fprint(
			writer,
			`{"code":"Ok","routes":[{"geometry":{"type":"LineString","coordinates":[[0.1,51],[0.2,52]]}}]}`,
		)
	}))
	defer server.Close()
	adapter := osrm.PubRouteCalculator{BaseURL: server.URL, Profile: "foot", Client: server.Client()}
	route, err := adapter.CalculatePubRoute(context.Background(), pubRoute(t))
	if err != nil {
		t.Fatal(err)
	}
	state := route.Snapshot()
	if state.Geometry.Coordinates[1][0] != 0.2 || state.Pubs[1].Hole != 2 {
		t.Fatal(state)
	}
}
