package upstream

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"io"
	"net/http"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"time"
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
	address := strings.TrimRight(adapter.BaseURL, "/") + "/route/v1/" + url.PathEscape(adapter.Profile) + "/" + strings.Join(coordinates, ";") + "?overview=full&geometries=geojson"
	var response struct {
		Code   string `json:"code"`
		Routes []struct {
			Geometry struct {
				Type        string      `json:"type"`
				Coordinates [][]float64 `json:"coordinates"`
			} `json:"geometry"`
		} `json:"routes"`
	}
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
	interval time.Duration
	slot     chan struct{}
	next     time.Time
}

func NewPlaces(baseURL string, client *http.Client, interval time.Duration) *Places {
	return &Places{baseURL: baseURL, client: client, interval: interval, slot: make(chan struct{}, 1)}
}
func (adapter *Places) Search(ctx context.Context, query string, latitude, longitude *float64) ([]domain.Place, error) {
	wait, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	select {
	case adapter.slot <- struct{}{}:
	case <-wait.Done():
		return nil, domain.Fail(domain.Unavailable, "Place search is busy — please try again in a moment")
	}
	defer func() { adapter.next = time.Now().Add(adapter.interval); <-adapter.slot }()
	if delay := time.Until(adapter.next); delay > 0 {
		timer := time.NewTimer(delay)
		defer timer.Stop()
		select {
		case <-timer.C:
		case <-wait.Done():
			return nil, domain.Fail(domain.Unavailable, "Place search is busy — please try again in a moment")
		}
	}
	address, err := url.Parse(strings.TrimRight(adapter.baseURL, "/") + "/search")
	if err != nil {
		return nil, err
	}
	parameters := url.Values{"q": {query}, "format": {"json"}, "limit": {"5"}}
	if latitude != nil && longitude != nil {
		parameters.Set("viewbox", fmt.Sprintf("%g,%g,%g,%g", *longitude-0.045, *latitude-0.045, *longitude+0.045, *latitude+0.045))
	}
	address.RawQuery = parameters.Encode()
	var response []struct {
		Name      string `json:"display_name"`
		Latitude  string `json:"lat"`
		Longitude string `json:"lon"`
	}
	if err = fetch(ctx, adapter.client, address.String(), &response); err != nil {
		return nil, domain.Fail(domain.Unavailable, "Failed to search places")
	}
	results := make([]domain.Place, 0, min(5, len(response)))
	for _, place := range response[:min(5, len(response))] {
		latitude, err := strconv.ParseFloat(place.Latitude, 64)
		if err != nil {
			return nil, domain.Fail(domain.Unavailable, "Failed to search places")
		}
		longitude, err := strconv.ParseFloat(place.Longitude, 64)
		if err != nil {
			return nil, domain.Fail(domain.Unavailable, "Failed to search places")
		}
		results = append(results, domain.Place{Name: place.Name, Latitude: latitude, Longitude: longitude})
	}
	return results, nil
}
