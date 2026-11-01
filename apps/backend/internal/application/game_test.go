package application_test

import (
	"context"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/memory"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"testing"
	"time"
)

func TestCreatedGameCanBeReadAndPlayed(t *testing.T) {
	repository := memory.New()
	service := application.New(repository, application.Dependencies{Identifier: func() string { return "identifier" }, Code: func() string { return "PAR001" }, Now: func() time.Time { return time.Unix(42, 0) }, Outcome: func() string { return "Tequila" }})
	game, err := service.Create(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.SubmitScore(context.Background(), game.Code, game.HostPlayerID, 1, 0, ""); err != nil {
		t.Fatal(err)
	}
	loaded, err := service.Get(context.Background(), "par001")
	if err != nil || loaded.Players[0].Scores[1].Value != 0 || len(loaded.Players[0].Scores) != 1 {
		t.Fatal(loaded, err)
	}
}
func TestFailedSaveDoesNotPublishAndConflictRetriesReuseRandomChoice(t *testing.T) {
	repository := memory.New()
	effects := &memory.Effects{}
	choices := 0
	service := application.New(repository, application.Dependencies{Identifier: func() string { return "identifier" }, Code: func() string { return "PAR001" }, Now: func() time.Time { return time.Unix(42, 0) }, Outcome: func() string { choices++; return "Tequila" }, Effects: effects})
	game, err := service.Create(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}
	before := len(effects.Games)
	repository.FailNext(domain.Fail(domain.StaleVersion, "conflict"))
	changed, err := service.Randomise(context.Background(), game.Code, game.HostPlayerID)
	if err != nil || choices != 1 || len(effects.Games) != before+1 || changed.Players[0].Randomise.Result != "Tequila" {
		t.Fatal(changed, err, choices)
	}
	repository.FailNext(domain.Fail(domain.Unavailable, "disk unavailable"))
	before = len(effects.Games)
	if _, err := service.SubmitScore(context.Background(), game.Code, game.HostPlayerID, 1, 1, ""); err == nil {
		t.Fatal("save should fail")
	}
	if len(effects.Games) != before {
		t.Fatal("published failed write")
	}
}

func TestRetryExhaustionAndNotificationFailure(t *testing.T) {
	repository := memory.New()
	effects := &memory.Effects{}
	service := application.New(repository, application.Dependencies{Identifier: func() string { return "identifier" }, Code: func() string { return "PAR001" }, Now: func() time.Time { return time.Unix(42, 0) }, Outcome: func() string { return "Tequila" }, Effects: effects})
	game, err := service.Create(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}
	for attempt := 0; attempt < 3; attempt++ {
		repository.FailNext(domain.Fail(domain.StaleVersion, "conflict"))
	}
	if _, err = service.SubmitScore(context.Background(), game.Code, game.HostPlayerID, 1, 1, ""); err == nil {
		t.Fatal("retry limit ignored")
	}
	loaded, _ := service.Get(context.Background(), game.Code)
	if len(loaded.Players[0].Scores) != 0 || len(effects.Games) != 1 {
		t.Fatal("failed update produced effects")
	}
	effects.Failure = fmt.Errorf("subscriber failed")
	if _, err = service.SubmitScore(context.Background(), game.Code, game.HostPlayerID, 1, 2, ""); err != nil {
		t.Fatal("notification failure undid committed action", err)
	}
	loaded, _ = service.Get(context.Background(), game.Code)
	if loaded.Players[0].Scores[1].Value != 2 {
		t.Fatal("commit lost")
	}
}
