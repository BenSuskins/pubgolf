package bootstrap

import (
	"context"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/metrics"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/nominatim"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/osrm"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/random"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/roundupdates"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
)

func Run(ctx context.Context, configuration Configuration) error {
	if err := os.MkdirAll(filepath.Dir(configuration.DatabasePath), 0o750); err != nil {
		return err
	}
	repository, err := sqlite.Open(configuration.DatabasePath)
	if err != nil {
		return err
	}
	defer repository.Close()
	broadcaster := roundupdates.New(16)
	defer broadcaster.Close()
	measurements := metrics.New()
	handler := buildHandler(configuration, repository, broadcaster, measurements)
	server := &http.Server{
		Addr:              ":" + configuration.Port,
		Handler:           measurements.Middleware(handler),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
		BaseContext:       func(net.Listener) context.Context { return ctx },
	}
	return serve(ctx, server)
}

func buildHandler(
	configuration Configuration,
	repository application.RoundRepository,
	broadcaster *roundupdates.Broadcaster,
	measurements *metrics.Metrics,
) http.Handler {
	client := providerHTTPClient()
	pubRouteCalculator := osrm.PubRouteCalculator{
		BaseURL: configuration.RoutingBaseURL,
		Profile: configuration.RoutingProfile,
		Client:  client,
	}
	placeSearcher := nominatim.NewPlaceSearcher(configuration.SearchBaseURL, client, time.Second)
	games := application.NewRoundApplication(repository, application.RoundDependencies{
		NewRoundID:            random.NewRoundID,
		NewPlayerID:           random.NewPlayerID,
		NewRoundCode:          random.NewRoundCode,
		Now:                   func() time.Time { return time.Now().UTC() },
		ChooseWildcardOutcome: random.ChooseWildcardOutcome,
		DomainEvents:          domainEventPublishers{measurements},
		RoundStates:           broadcaster,
		Subscriptions:         broadcaster,
		PubRoutes:             pubRouteCalculator,
	})
	return httpapi.New(
		games,
		application.NewPlaceSearch(placeSearcher),
		httpapi.Options{Origins: configuration.Origins, Metrics: measurements.Handler()},
	)
}

func providerHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			DialContext:           (&net.Dialer{Timeout: 3 * time.Second}).DialContext,
			ResponseHeaderTimeout: 10 * time.Second,
			IdleConnTimeout:       90 * time.Second,
		},
	}
}
