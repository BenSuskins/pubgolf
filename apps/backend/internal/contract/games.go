package contract

import (
	"context"
	"errors"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"reflect"
	"sync"
	"testing"
	"time"
)

func Games(t *testing.T, newRepository func(t *testing.T) application.Games) {
	t.Helper()
	t.Run("round trip aggregate and reject stale writes", func(t *testing.T) {
		repository := newRepository(t)
		ctx := context.Background()
		game := domain.NewGame("game", "PAR001", "host", "Alice")
		game, _, _ = domain.SubmitScore(game, "host", 1, 2, "SKIP", time.Unix(42, 0).UTC())
		game.Holes = domain.DefaultCourse()
		game.Pubs = []domain.Pub{{Hole: 1, Name: "Pub", Latitude: 51, Longitude: 0.1}}
		game.Route = &domain.Geometry{Type: "LineString", Coordinates: [][]float64{{0.1, 51}, {0.2, 52}}}
		game.ActiveEvent = &domain.ActiveEvent{ID: "custom", Title: "Hello", ActivatedAt: time.Unix(43, 0).UTC()}
		game.Players[0].Randomise = &domain.Randomise{Hole: 2, Result: "Tequila"}
		saved, err := repository.Save(ctx, game, 0)
		if err != nil {
			t.Fatal(err)
		}
		loaded, err := repository.Get(ctx, "par001")
		if err != nil || !reflect.DeepEqual(saved, loaded) {
			t.Fatalf("round trip: %v\n%#v\n%#v", err, saved, loaded)
		}
		_, err = repository.Save(ctx, game, 0)
		kind(t, err, domain.DuplicateCode)
		updated := domain.Clone(loaded)
		updated.Players[0].Name = "Updated"
		updated.Pubs = nil
		updated.Route = nil
		updated.Holes = nil
		updated.ActiveEvent = nil
		updated, err = repository.Save(ctx, updated, loaded.Version)
		if err != nil {
			t.Fatal(err)
		}
		_, err = repository.Save(ctx, loaded, loaded.Version)
		kind(t, err, domain.StaleVersion)
		latest, err := repository.Get(ctx, game.Code)
		if err != nil || !reflect.DeepEqual(updated, latest) {
			t.Fatal("stale write changed data", err)
		}
		cancelled, cancel := context.WithCancel(ctx)
		cancel()
		if _, err = repository.Save(cancelled, latest, latest.Version); err == nil {
			t.Fatal("cancelled save succeeded")
		}
		_, err = repository.Get(ctx, "missing")
		kind(t, err, domain.NotFound)
	})
	t.Run("only one writer wins an expected version", func(t *testing.T) {
		repository := newRepository(t)
		ctx := context.Background()
		game, err := repository.Save(ctx, domain.NewGame("game", "PAR001", "host", "Alice"), 0)
		if err != nil {
			t.Fatal(err)
		}
		results := make(chan error, 2)
		var workers sync.WaitGroup
		for index := 0; index < 2; index++ {
			workers.Add(1)
			go func() { defer workers.Done(); _, err := repository.Save(ctx, game, game.Version); results <- err }()
		}
		workers.Wait()
		close(results)
		successes := 0
		for err := range results {
			if err == nil {
				successes++
			} else {
				kind(t, err, domain.StaleVersion)
			}
		}
		if successes != 1 {
			t.Fatal(successes)
		}
	})
}
func kind(t *testing.T, err error, expected domain.FailureKind) {
	t.Helper()
	var failure *domain.Failure
	if !errors.As(err, &failure) || failure.Kind != expected {
		t.Fatalf("want %s, got %v", expected, err)
	}
}
