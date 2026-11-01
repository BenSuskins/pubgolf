package nominatim

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpjson"

	"golang.org/x/sync/semaphore"
	"golang.org/x/time/rate"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type PlaceSearcher struct {
	baseURL  string
	client   *http.Client
	requests *semaphore.Weighted
	limiter  *rate.Limiter
}

func NewPlaceSearcher(baseURL string, client *http.Client, interval time.Duration) *PlaceSearcher {
	return &PlaceSearcher{
		baseURL:  baseURL,
		client:   client,
		requests: semaphore.NewWeighted(1),
		limiter:  rate.NewLimiter(rate.Every(interval), 1),
	}
}

func (adapter *PlaceSearcher) SearchPlaces(
	ctx context.Context,
	query string,
	latitude, longitude *float64,
) ([]domain.Place, error) {
	wait, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := adapter.requests.Acquire(wait, 1); err != nil {
		return nil, searchBusy()
	}
	defer adapter.requests.Release(1)
	if err := adapter.limiter.Wait(wait); err != nil {
		return nil, searchBusy()
	}
	address, err := adapter.searchURL(query, latitude, longitude)
	if err != nil {
		return nil, err
	}
	var response []nominatimPlace
	if err = httpjson.Get(ctx, adapter.client, address, &response); err != nil {
		return nil, domain.Fail(domain.Unavailable, "Failed to search places")
	}
	results := make([]domain.Place, 0, min(5, len(response)))
	for _, place := range response[:min(5, len(response))] {
		results = append(results, domain.Place{Name: place.Name, Latitude: place.Latitude, Longitude: place.Longitude})
	}
	return results, nil
}

func (adapter *PlaceSearcher) searchURL(query string, latitude, longitude *float64) (string, error) {
	address, err := url.Parse(strings.TrimRight(adapter.baseURL, "/") + "/search")
	if err != nil {
		return "", err
	}
	parameters := url.Values{"q": {query}, "format": {"json"}, "limit": {"5"}}
	if latitude != nil && longitude != nil {
		parameters.Set(
			"viewbox",
			fmt.Sprintf("%g,%g,%g,%g", *longitude-0.045, *latitude-0.045, *longitude+0.045, *latitude+0.045),
		)
	}
	address.RawQuery = parameters.Encode()
	return address.String(), nil
}

func searchBusy() error {
	return domain.Fail(domain.Unavailable, "Place search is busy — please try again in a moment")
}
