package upstream

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"golang.org/x/sync/semaphore"
	"golang.org/x/time/rate"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func fetch(ctx context.Context, client *http.Client, address string, destination any) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, address, nil)
	if err != nil {
		return err
	}
	request.Header.Set("User-Agent", "PubGolf/1.0")
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("upstream returned HTTP %d", response.StatusCode)
	}
	return json.NewDecoder(io.LimitReader(response.Body, 2<<20)).Decode(destination)
}

type Router struct {
	BaseURL, Profile string
	Client           *http.Client
}

func (adapter Router) Calculate(ctx context.Context, pubs []domain.Pub) (*domain.Geometry, error) {
	if len(pubs) == 0 {
		return nil, nil
	}
	pubs = slices.Clone(pubs)
	slices.SortFunc(pubs, func(left, right domain.Pub) int { return left.Hole - right.Hole })
	coordinates := make([]string, 0, len(pubs))
	for _, pub := range pubs {
		coordinates = append(coordinates, fmt.Sprintf("%g,%g", pub.Longitude, pub.Latitude))
	}
	address := strings.TrimRight(
		adapter.BaseURL,
		"/",
	) + "/route/v1/" + url.PathEscape(
		adapter.Profile,
	) + "/" + strings.Join(
		coordinates,
		";",
	) + "?overview=full&geometries=geojson"
	var response osrmResponse
	if err := fetch(ctx, adapter.Client, address, &response); err != nil {
		return nil, err
	}
	if response.Code != "Ok" || len(response.Routes) == 0 {
		return nil, nil
	}
	geometry := response.Routes[0].Geometry
	return &domain.Geometry{Type: geometry.Type, Coordinates: geometry.Coordinates}, nil
}

type Places struct {
	baseURL  string
	client   *http.Client
	requests *semaphore.Weighted
	limiter  *rate.Limiter
}

func NewPlaces(baseURL string, client *http.Client, interval time.Duration) *Places {
	return &Places{
		baseURL:  baseURL,
		client:   client,
		requests: semaphore.NewWeighted(1),
		limiter:  rate.NewLimiter(rate.Every(interval), 1),
	}
}

func (adapter *Places) Search(ctx context.Context, query string, latitude, longitude *float64) ([]domain.Place, error) {
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
	if err = fetch(ctx, adapter.client, address, &response); err != nil {
		return nil, domain.Fail(domain.Unavailable, "Failed to search places")
	}
	results := make([]domain.Place, 0, min(5, len(response)))
	for _, place := range response[:min(5, len(response))] {
		results = append(results, domain.Place{Name: place.Name, Latitude: place.Latitude, Longitude: place.Longitude})
	}
	return results, nil
}

func (adapter *Places) searchURL(query string, latitude, longitude *float64) (string, error) {
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
