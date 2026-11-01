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

func GameRepository(t *testing.T, newRepository func(*testing.T) application.GameRepository) {
	t.Helper()
	cases := map[string]func(*testing.T, application.GameRepository){
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

func Aggregate(t *testing.T) domain.Game {
	t.Helper()
	name, _ := domain.NewPlayerName("Alice")
	game, _, err := domain.NewGame("game", "PAR001", "host", name)
	if err != nil {
		t.Fatal(err)
	}
	state := game.Snapshot()
	state.Players[0].Scores[1] = domain.RecordedScore{Value: 5, At: time.Unix(42, 0).UTC()}
	state.Players[0].Penalties[1] = "SKIP"
	state.Holes = domain.DefaultCourse().Holes()
	state.PubRoute = domain.PubRouteSnapshot{
		Pubs:     make([]domain.PubSnapshot, 9),
		Geometry: &domain.PubRouteGeometry{Type: "LineString", Coordinates: [][]float64{{0.1, 51}, {0.2, 52}}},
	}
	for index := range state.PubRoute.Pubs {
		state.PubRoute.Pubs[index] = domain.PubSnapshot{Hole: index + 1, Name: "Pub", Latitude: 51, Longitude: 0.1}
	}
	state.ActiveGameplayEvent = &domain.ActiveGameplayEvent{
		ID:          "custom",
		Title:       "Hello",
		ActivatedAt: time.Unix(43, 0).UTC(),
	}
	state.Players[0].Randomise = &domain.RandomiseResult{Hole: 2, Result: "Tequila"}
	restored, err := domain.RestoreGame(state)
	if err != nil {
		t.Fatal(err)
	}
	return restored
}

func aggregateRoundTrip(t *testing.T, repository application.GameRepository) {
	assertStored(t, repository, save(t, repository, Aggregate(t), 0))
}

func rejectStaleWrites(t *testing.T, repository application.GameRepository) {
	original := save(t, repository, Aggregate(t), 0)
	state := original.Snapshot()
	state.Players[0].Name = "Updated"
	state.PubRoute = domain.PubRouteSnapshot{}
	state.Holes = nil
	state.ActiveGameplayEvent = nil
	updated, err := domain.RestoreGame(state)
	if err != nil {
		t.Fatal(err)
	}
	updated = save(t, repository, updated, original.Version())
	_, err = repository.Save(context.Background(), original, original.Version())
	kind(t, err, domain.StaleVersion)
	assertStored(t, repository, updated)
}

func duplicateAndMissingGames(t *testing.T, repository application.GameRepository) {
	original := save(t, repository, Aggregate(t), 0)
	_, err := repository.Save(context.Background(), original, 0)
	kind(t, err, domain.DuplicateCode)
	_, err = repository.FindByCode(context.Background(), "missing")
	kind(t, err, domain.NotFound)
}

func cancelledSaves(t *testing.T, repository application.GameRepository) {
	original := save(t, repository, Aggregate(t), 0)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := repository.Save(ctx, original, original.Version()); err == nil {
		t.Fatal("cancelled save succeeded")
	}
	assertStored(t, repository, original)
}

func concurrentWriters(t *testing.T, repository application.GameRepository) {
	game := save(t, repository, Aggregate(t), 0)
	results := make([]error, 2)
	var workers sync.WaitGroup
	for index := range results {
		workers.Go(func() { _, results[index] = repository.Save(context.Background(), game, game.Version()) })
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

func save(t *testing.T, repository application.GameRepository, game domain.Game, version int64) domain.Game {
	t.Helper()
	saved, err := repository.Save(context.Background(), game, version)
	if err != nil {
		t.Fatal(err)
	}
	return saved
}

func assertStored(t *testing.T, repository application.GameRepository, expected domain.Game) {
	t.Helper()
	actual, err := repository.FindByCode(context.Background(), "par001")
	if err != nil || !reflect.DeepEqual(actual.Snapshot(), expected.Snapshot()) {
		t.Fatalf("round trip: %v\n%#v\n%#v", err, expected.Snapshot(), actual.Snapshot())
	}
}

func kind(t *testing.T, err error, expected domain.FailureKind) {
	t.Helper()
	var failure *domain.Failure
	if !errors.As(err, &failure) || failure.Kind != expected {
		t.Fatalf("want %s, got %v", expected, err)
	}
}
