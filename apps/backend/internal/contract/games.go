package contract

import (
	"context"
	"errors"
	"reflect"
	"sync"
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func Games(t *testing.T, newRepository func(t *testing.T) application.Games) {
	t.Helper()
	cases := map[string]func(*testing.T, application.Games){
		"aggregate round trip":                aggregateRoundTrip,
		"reject stale writes":                 rejectStaleWrites,
		"duplicate codes and missing games":   duplicateAndMissingGames,
		"cancelled saves":                     cancelledSaves,
		"one writer wins an expected version": concurrentWriters,
	}
	for name, scenario := range cases {
		t.Run(name, func(t *testing.T) { scenario(t, newRepository(t)) })
	}
}

func aggregate() domain.Game {
	game := domain.NewGame("game", "PAR001", "host", "Alice")
	game.Players[0].Scores[1] = domain.Score{Value: 5, At: time.Unix(42, 0).UTC()}
	game.Players[0].Penalties[1] = "SKIP"
	game.Holes = domain.DefaultCourse()
	game.Pubs = []domain.Pub{{Hole: 1, Name: "Pub", Latitude: 51, Longitude: 0.1}}
	game.Route = &domain.Geometry{Type: "LineString", Coordinates: [][]float64{{0.1, 51}, {0.2, 52}}}
	game.ActiveEvent = &domain.ActiveEvent{ID: "custom", Title: "Hello", ActivatedAt: time.Unix(43, 0).UTC()}
	game.Players[0].Randomise = &domain.Randomise{Hole: 2, Result: "Tequila"}
	return game
}

func aggregateRoundTrip(t *testing.T, repository application.Games) {
	saved := save(t, repository, aggregate(), 0)
	assertStored(t, repository, saved)
}

func rejectStaleWrites(t *testing.T, repository application.Games) {
	original := save(t, repository, aggregate(), 0)
	updated := domain.Clone(original)
	updated.Players[0].Name = "Updated"
	updated.Pubs, updated.Route, updated.Holes, updated.ActiveEvent = nil, nil, nil, nil
	updated = save(t, repository, updated, original.Version)
	_, err := repository.Save(context.Background(), original, original.Version)
	kind(t, err, domain.StaleVersion)
	assertStored(t, repository, updated)
}

func duplicateAndMissingGames(t *testing.T, repository application.Games) {
	original := save(t, repository, aggregate(), 0)
	_, err := repository.Save(context.Background(), original, 0)
	kind(t, err, domain.DuplicateCode)
	_, err = repository.Get(context.Background(), "missing")
	kind(t, err, domain.NotFound)
}

func cancelledSaves(t *testing.T, repository application.Games) {
	original := save(t, repository, aggregate(), 0)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := repository.Save(ctx, original, original.Version); err == nil {
		t.Fatal("cancelled save succeeded")
	}
	assertStored(t, repository, original)
}

func concurrentWriters(t *testing.T, repository application.Games) {
	game := save(t, repository, aggregate(), 0)
	results := make([]error, 2)
	var workers sync.WaitGroup
	for index := range results {
		workers.Go(func() { _, results[index] = repository.Save(context.Background(), game, game.Version) })
	}
	workers.Wait()
	successes := 0
	for _, err := range results {
		if err == nil {
			successes++
		} else {
			kind(t, err, domain.StaleVersion)
		}
	}
	if successes != 1 {
		t.Fatal(successes)
	}
}

func save(t *testing.T, repository application.Games, game domain.Game, version int64) domain.Game {
	t.Helper()
	saved, err := repository.Save(context.Background(), game, version)
	if err != nil {
		t.Fatal(err)
	}
	return saved
}

func assertStored(t *testing.T, repository application.Games, expected domain.Game) {
	t.Helper()
	actual, err := repository.Get(context.Background(), "par001")
	if err != nil || !reflect.DeepEqual(actual, expected) {
		t.Fatalf("round trip: %v\n%#v\n%#v", err, expected, actual)
	}
}

func kind(t *testing.T, err error, expected domain.FailureKind) {
	t.Helper()
	var failure *domain.Failure
	if !errors.As(err, &failure) || failure.Kind != expected {
		t.Fatalf("want %s, got %v", expected, err)
	}
}
