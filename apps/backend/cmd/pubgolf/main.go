package main

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/httpapi"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/live"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/metrics"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/upstream"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"log/slog"
	"math/big"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

func environment(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
func random(limit int) int {
	value, err := rand.Int(rand.Reader, big.NewInt(int64(limit)))
	if err != nil {
		panic(err)
	}
	return int(value.Int64())
}
func identifier() string {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		panic(err)
	}
	value[6] = (value[6] & 0x0f) | 0x40
	value[8] = (value[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", value[:4], value[4:6], value[6:8], value[8:10], value[10:])
}
func code() string {
	terms := []string{"PAR", "BIRDIE", "BOGEY", "EAGLE", "ALBATROSS", "ACE", "FORE", "HOOK", "SLICE"}
	return fmt.Sprintf("%s%03d", terms[random(len(terms))], random(1000))
}
func outcome() string {
	options := domain.Outcomes()
	total := 0
	for _, option := range options {
		total += option.Weight
	}
	choice := random(total)
	for _, option := range options {
		choice -= option.Weight
		if choice < 0 {
			return option.Label
		}
	}
	panic("invalid outcome weights")
}

type effects []application.Effects

func (adapters effects) Committed(ctx context.Context, game domain.Game, events []domain.Event) error {
	for _, event := range events {
		slog.Info("Game action committed", "game", game.Code, "event", event.Kind)
	}
	var failures []error
	for _, adapter := range adapters {
		if err := adapter.Committed(ctx, game, events); err != nil {
			failures = append(failures, err)
		}
	}
	return errors.Join(failures...)
}
func run() error {
	path := environment("DATABASE_PATH", "pubgolf-go.db")
	if err := os.MkdirAll(filepath.Dir(path), 0750); err != nil {
		return err
	}
	repository, err := sqlite.Open(path)
	if err != nil {
		return err
	}
	defer repository.Close()
	hub := live.New(16)
	defer hub.Close()
	measurements := metrics.New()
	client := &http.Client{Timeout: 10 * time.Second, Transport: &http.Transport{DialContext: (&net.Dialer{Timeout: 3 * time.Second}).DialContext, ResponseHeaderTimeout: 10 * time.Second, IdleConnTimeout: 90 * time.Second}}
	router := upstream.Router{BaseURL: environment("OSRM_BASE_URL", "https://router.project-osrm.org"), Profile: environment("OSRM_PROFILE", "foot"), Client: client}
	places := upstream.NewPlaces(environment("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org"), client, time.Second)
	service := application.New(repository, application.Dependencies{Identifier: identifier, Code: code, Now: func() time.Time { return time.Now().UTC() }, Outcome: outcome, Effects: effects{hub, measurements}, Streams: hub, Router: router, Places: places})
	handler := httpapi.New(service, httpapi.Options{Origins: strings.Split(environment("ALLOWED_ORIGINS", "http://localhost:3000,https://pubgolf.suskins.co.uk,https://www.pubgolf.me,https://pubgolf.me"), ","), Metrics: measurements.Handler()})
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	server := &http.Server{Addr: ":" + environment("PORT", "8080"), Handler: measurements.Middleware(handler), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second, BaseContext: func(net.Listener) context.Context { return ctx }}
	failures := make(chan error, 1)
	go func() {
		slog.Info("Pub Golf backend listening", "address", server.Addr)
		failures <- server.ListenAndServe()
	}()
	select {
	case err := <-failures:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
	}
	hub.Close()
	shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return server.Shutdown(shutdown)
}
func main() {
	if err := run(); err != nil {
		slog.Error("Backend stopped", "error", err)
		os.Exit(1)
	}
}
