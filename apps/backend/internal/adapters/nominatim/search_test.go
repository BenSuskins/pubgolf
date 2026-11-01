package nominatim_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/nominatim"
)

func TestPlaceSearchEncodesQueryAndBiasesResults(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Query().Get("q") != "Beer & Wine #1" || request.Header.Get("User-Agent") != "PubGolf/1.0" ||
			request.URL.Query().Get("viewbox") == "" {
			t.Error(request.URL, request.Header)
		}
		fmt.Fprint(writer, `[{"display_name":"Pub","lat":"51.5","lon":"-0.1"}]`)
	}))
	defer server.Close()
	adapter := nominatim.NewPlaceSearcher(server.URL, server.Client(), time.Millisecond)
	latitude, longitude := 51.5, -0.1
	places, err := adapter.SearchPlaces(context.Background(), "Beer & Wine #1", &latitude, &longitude)
	if err != nil || len(places) != 1 || places[0].Name != "Pub" || places[0].Latitude != 51.5 {
		t.Fatal(places, err)
	}
}

func TestUpstreamFailureAndCancellation(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) { writer.WriteHeader(503) }),
	)
	defer server.Close()
	adapter := nominatim.NewPlaceSearcher(server.URL, server.Client(), time.Second)
	if _, err := adapter.SearchPlaces(context.Background(), "pub", nil, nil); err == nil {
		t.Fatal("accepted upstream error")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := adapter.SearchPlaces(ctx, "pub", nil, nil); err == nil {
		t.Fatal("ignored cancellation")
	}
}

func TestPlaceSearchSerialisesRequestsAndHonoursSpacing(t *testing.T) {
	var mutex sync.Mutex
	starts := []time.Time{}
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		mutex.Lock()
		starts = append(starts, time.Now())
		mutex.Unlock()
		fmt.Fprint(writer, `[]`)
	}))
	defer server.Close()
	adapter := nominatim.NewPlaceSearcher(server.URL, server.Client(), 30*time.Millisecond)
	var workers sync.WaitGroup
	for index := 0; index < 2; index++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			if _, err := adapter.SearchPlaces(context.Background(), "pub", nil, nil); err != nil {
				t.Error(err)
			}
		}()
	}
	workers.Wait()
	if len(starts) != 2 || starts[1].Sub(starts[0]) < 25*time.Millisecond {
		t.Fatal("upstream calls were not spaced", starts)
	}
}
