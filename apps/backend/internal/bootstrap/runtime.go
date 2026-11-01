package bootstrap

import (
	"context"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/live"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/metrics"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/random"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/upstream"
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
	hub := live.New(16)
	defer hub.Close()
	measurements := metrics.New()
	handler := buildHandler(configuration, repository, hub, measurements)
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
	repository application.Games,
	hub *live.Hub,
	measurements *metrics.Metrics,
) http.Handler {
	client := upstreamClient()
	router := upstream.Router{
		BaseURL: configuration.RoutingBaseURL,
		Profile: configuration.RoutingProfile,
		Client:  client,
	}
	places := upstream.NewPlaces(configuration.SearchBaseURL, client, time.Second)
	service := application.New(repository, application.Dependencies{
		Identifier: random.Identifier,
		Code:       random.GameCode,
		Now:        func() time.Time { return time.Now().UTC() },
		Outcome:    random.Outcome,
		Effects:    committedEffects{hub, measurements},
		Streams:    hub,
		Router:     router,
		Places:     places,
	})
	return httpapi.New(service, httpapi.Options{Origins: configuration.Origins, Metrics: measurements.Handler()})
}

func upstreamClient() *http.Client {
	return &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			DialContext:           (&net.Dialer{Timeout: 3 * time.Second}).DialContext,
			ResponseHeaderTimeout: 10 * time.Second,
			IdleConnTimeout:       90 * time.Second,
		},
	}
}
