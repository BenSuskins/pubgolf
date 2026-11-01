package domain_test

import (
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestScoreReplacesPenaltyWithoutChangingOriginalGame(t *testing.T) {
	game := domain.NewGame("game", "PAR001", "host", "Alice")
	at := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	penalised, _, err := domain.SubmitScore(game, "host", 1, 2, "SKIP", at)
	if err != nil {
		t.Fatal(err)
	}
	updated, events, err := domain.SubmitScore(penalised, "host", 1, 0, "", at)
	if err != nil {
		t.Fatal(err)
	}
	if len(game.Players[0].Scores) != 0 {
		t.Fatal("original game changed")
	}
	if penalised.Players[0].Scores[1].Value != 5 {
		t.Fatal("skip must score five")
	}
	if updated.Players[0].Scores[1].Value != 0 || len(updated.Players[0].Penalties) != 0 {
		t.Fatal("zero is played and removes the penalty")
	}
	if len(events) != 1 || events[0].Kind != domain.ScoreSubmitted {
		t.Fatal(events)
	}
}

func TestGameLifecycleAndHostRules(t *testing.T) {
	game := domain.NewGame("game", "PAR001", "host", "Alice")
	joined, _, err := domain.Join(game, "Bob", "bob", false)
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := domain.Complete(joined, "bob"); err == nil {
		t.Fatal("non-host completed game")
	}
	completed, _, err := domain.Complete(joined, "host")
	if err != nil || completed.Status != "COMPLETED" {
		t.Fatal(completed, err)
	}
	if _, _, err := domain.Join(completed, "Carl", "carl", false); err == nil {
		t.Fatal("joined completed game")
	}
	if _, _, err := domain.SubmitScore(completed, "host", 1, 1, "", time.Now()); err == nil {
		t.Fatal("scored completed game")
	}
}

func TestRandomiseUsesFirstUnplayedHoleAndOnlyOnce(t *testing.T) {
	game := domain.NewGame("game", "PAR001", "host", "Alice")
	game, _, _ = domain.SubmitScore(game, "host", 1, 0, "", time.Now())
	changed, _, err := domain.RandomisePlayer(game, "host", "Tequila")
	if err != nil {
		t.Fatal(err)
	}
	if changed.Players[0].Randomise.Hole != 2 {
		t.Fatal("zero score must count as played")
	}
	if _, _, err := domain.RandomisePlayer(changed, "host", "Wine"); err == nil {
		t.Fatal("used randomise twice")
	}
}

func TestCourseAndEventRules(t *testing.T) {
	game := domain.NewGame("game", "PAR001", "host", "Alice")
	course := domain.DefaultCourse()
	course[0].Par = 0
	if _, _, err := domain.SetCourse(game, "host", course); err == nil {
		t.Fatal("accepted zero par")
	}
	course = domain.DefaultCourse()
	course[0].Drinks[0].Route = " "
	if _, _, err := domain.SetCourse(game, "host", course); err == nil {
		t.Fatal("accepted blank route")
	}
	event := domain.ActiveEvent{ID: "photo-op", Title: "Photo Op!", ActivatedAt: time.Now()}
	changed, _, err := domain.ActivateEvent(game, "host", event)
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := domain.ActivateEvent(changed, "host", event); err == nil {
		t.Fatal("replaced active event")
	}
	completed, _, _ := domain.Complete(changed, "host")
	if completed.ActiveEvent != nil {
		t.Fatal("completion retained event")
	}
}
