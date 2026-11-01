package sqlite_test

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/contract"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestGameRepositoryContract(t *testing.T) {
	contract.GameRepository(t, func(t *testing.T) application.GameRepository {
		repository, err := sqlite.Open(filepath.Join(t.TempDir(), "games.db"))
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { repository.Close() })
		return repository
	})
}

func TestPersistenceSurvivesRestart(t *testing.T) {
	path := filepath.Join(t.TempDir(), "games.db")
	repository, err := sqlite.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	saved, err := repository.Save(context.Background(), contract.Aggregate(t), 0)
	if err != nil {
		t.Fatal(err)
	}
	repository.Close()
	repository, err = sqlite.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	loaded, err := repository.FindByCode(context.Background(), "PAR001")
	if err != nil || loaded.ID() != saved.ID() || loaded.Version() != 1 {
		t.Fatal(loaded, err)
	}
}

func TestFailedChildWriteRollsBackTheWholeGame(t *testing.T) {
	path := filepath.Join(t.TempDir(), "games.db")
	repository, err := sqlite.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	ctx := context.Background()
	original, err := repository.Save(ctx, contract.Aggregate(t), 0)
	if err != nil {
		t.Fatal(err)
	}
	database, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	_, err = database.Exec(
		"CREATE TRIGGER reject_scores BEFORE INSERT ON scores BEGIN SELECT RAISE(ABORT,'injected storage failure'); END;",
	)
	if err != nil {
		t.Fatal(err)
	}
	state := original.Snapshot()
	state.Players[0].Name = "Must roll back"
	updated, err := domain.RestoreGame(state)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = repository.Save(ctx, updated, original.Version()); err == nil {
		t.Fatal("child write did not fail")
	}
	loaded, err := repository.FindByCode(ctx, original.Code())
	if err != nil {
		t.Fatal(err)
	}
	if loaded.Version() != original.Version() || loaded.Snapshot().Players[0].Name != "Alice" {
		t.Fatal("partial write escaped transaction")
	}
}

func TestPreRefactorDatabaseCanBeReadAndUpdated(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")
	database, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	fixture, err := os.ReadFile("testdata/pre-domain-refactor.sql")
	if err != nil {
		t.Fatal(err)
	}
	_, err = database.Exec(string(fixture))
	database.Close()
	if err != nil {
		t.Fatal(err)
	}
	repository, err := sqlite.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	game, err := repository.FindByCode(context.Background(), "par123")
	if err != nil {
		t.Fatal(err)
	}
	assertLegacyState(t, game.Snapshot())
	saved, err := repository.Save(context.Background(), game, game.Version())
	if err != nil {
		t.Fatal(err)
	}
	restored, err := repository.FindByCode(context.Background(), saved.Code())
	if err != nil {
		t.Fatal(err)
	}
	assertLegacyState(t, restored.Snapshot())
}

func assertLegacyState(t *testing.T, state domain.GameSnapshot) {
	t.Helper()
	if state.Players[0].Name != "Alice" || state.Players[0].Scores[1].Value != 0 {
		t.Fatal("player or score changed")
	}
	if state.Players[1].Penalties[2] != "SKIP" || state.Players[1].Randomise.Result != "Tequila" {
		t.Fatal("penalty or randomise changed")
	}
	if state.ActiveGameplayEvent.Title != "Custom" || len(state.Holes) != 9 ||
		state.Holes[0].Drinks[0].TrackName != "Route A" {
		t.Fatal("event or course changed")
	}
	if len(state.PubRoute.Pubs) != 9 || state.PubRoute.Geometry.Coordinates[1][0] != -0.2 {
		t.Fatal("pub route changed")
	}
}
