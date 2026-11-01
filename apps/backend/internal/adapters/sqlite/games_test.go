package sqlite_test

import (
	"context"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/sqlite"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/contract"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"path/filepath"
	"testing"
)

func TestGamesContract(t *testing.T) {
	contract.Games(t, func(t *testing.T) application.Games {
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
	saved, err := repository.Save(context.Background(), domain.NewGame("game", "PAR001", "host", "Alice"), 0)
	if err != nil {
		t.Fatal(err)
	}
	repository.Close()
	repository, err = sqlite.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	loaded, err := repository.Get(context.Background(), "PAR001")
	if err != nil || loaded.ID != saved.ID || loaded.Version != 1 {
		t.Fatal(loaded, err)
	}
}

func TestFailedChildWriteRollsBackTheWholeGame(t *testing.T) {
	repository, err := sqlite.Open(filepath.Join(t.TempDir(), "games.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer repository.Close()
	ctx := context.Background()
	original, err := repository.Save(ctx, domain.NewGame("game", "PAR001", "host", "Alice"), 0)
	if err != nil {
		t.Fatal(err)
	}
	invalid := domain.Clone(original)
	invalid.Players[0].Name = "Must roll back"
	invalid.Players[0].Scores[1] = domain.Score{Value: 99}
	if _, err = repository.Save(ctx, invalid, original.Version); err == nil {
		t.Fatal("invalid child write succeeded")
	}
	loaded, err := repository.Get(ctx, original.Code)
	if err != nil {
		t.Fatal(err)
	}
	if loaded.Version != original.Version || loaded.Players[0].Name != "Alice" || len(loaded.Players[0].Scores) != 0 {
		t.Fatal("partial write escaped transaction", loaded)
	}
}
