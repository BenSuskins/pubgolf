package domain_test

import (
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func newGame(t *testing.T) domain.Game {
	t.Helper()
	name, err := domain.NewPlayerName("Alice")
	if err != nil {
		t.Fatal(err)
	}
	game, events, err := domain.NewGame("game", "PAR001", "host", name)
	if err != nil || len(events) != 1 {
		t.Fatal(events, err)
	}
	return game
}

func submit(t *testing.T, game domain.Game, score int, penalty string) (domain.Game, []domain.DomainEvent) {
	t.Helper()
	hole, _ := domain.NewHoleNumber(1)
	value, _ := domain.NewScore(score)
	updated, events, err := game.SubmitScore("host", hole, value, penalty, time.Unix(42, 0).UTC())
	if err != nil {
		t.Fatal(err)
	}
	return updated, events
}

func TestScoreReplacesPenaltyWithoutChangingOriginalGame(t *testing.T) {
	game := newGame(t)
	penalised, _ := submit(t, game, 2, "SKIP")
	updated, events := submit(t, penalised, 0, "")
	if len(game.Snapshot().Players[0].Scores) != 0 {
		t.Fatal("original changed")
	}
	if penalised.Snapshot().Players[0].Scores[1].Value != 5 {
		t.Fatal("skip must score five")
	}
	state := updated.Snapshot()
	if state.Players[0].Scores[1].Value != 0 || len(state.Players[0].Penalties) != 0 {
		t.Fatal("zero is played and removes penalty")
	}
	fact, ok := events[0].(domain.ScoreSubmitted)
	if !ok || fact.Score.Value() != 0 || fact.Hole.Value() != 1 {
		t.Fatal(events)
	}
}

func TestSnapshotCannotChangeAggregateState(t *testing.T) {
	game, _ := submit(t, newGame(t), 2, "")
	snapshot := game.Snapshot()
	snapshot.Players[0].Name = "Changed"
	snapshot.Players[0].Scores[1] = domain.RecordedScore{Value: 9}
	snapshot.Players = append(snapshot.Players, domain.PlayerSnapshot{ID: "intruder"})
	state := game.Snapshot()
	if len(state.Players) != 1 || state.Players[0].Name != "Alice" || state.Players[0].Scores[1].Value != 2 {
		t.Fatal("snapshot aliases aggregate")
	}
}

func TestGameLifecycleAndHostRules(t *testing.T) {
	game := newGame(t)
	name, _ := domain.NewPlayerName("Bob")
	joined, _, err := game.Join(name, "bob", false)
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err = joined.Complete("bob"); err == nil {
		t.Fatal("non-host completed game")
	}
	completed, _, err := joined.Complete("host")
	if err != nil || completed.Snapshot().Status != "COMPLETED" {
		t.Fatal(err)
	}
	if _, _, err = completed.Join(name, "other", false); err == nil {
		t.Fatal("joined completed game")
	}
	hole, _ := domain.NewHoleNumber(1)
	score, _ := domain.NewScore(1)
	if _, _, err = completed.SubmitScore("host", hole, score, "", time.Now()); err == nil {
		t.Fatal("scored completed game")
	}
}

func TestRandomiseUsesFirstUnplayedHoleAndOnlyOnce(t *testing.T) {
	game, _ := submit(t, newGame(t), 0, "")
	changed, _, err := game.Randomise("host", "Tequila")
	if err != nil {
		t.Fatal(err)
	}
	if changed.Snapshot().Players[0].Randomise.Hole != 2 {
		t.Fatal("zero must count as played")
	}
	if _, _, err = changed.Randomise("host", "Wine"); err == nil {
		t.Fatal("randomised twice")
	}
}

func TestCourseAndGameplayEventRules(t *testing.T) {
	game := newGame(t)
	holes := domain.DefaultCourse().Holes()
	holes[0].Par = 0
	if _, err := domain.NewCourse(holes); err == nil {
		t.Fatal("accepted zero par")
	}
	holes = domain.DefaultCourse().Holes()
	holes[0].Drinks[0].TrackName = " "
	if _, err := domain.NewCourse(holes); err == nil {
		t.Fatal("accepted blank track")
	}
	changed, _, err := game.ActivateGameplayEvent("host", "photo-op", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err = changed.ActivateGameplayEvent("host", "speed-round", time.Now()); err == nil {
		t.Fatal("replaced active event")
	}
	completed, _, _ := changed.Complete("host")
	if completed.Snapshot().ActiveGameplayEvent != nil {
		t.Fatal("retained event")
	}
}

func TestRestorationValidatesAndCopiesSnapshot(t *testing.T) {
	original, _ := submit(t, newGame(t), 0, "")
	snapshot := original.Snapshot()
	restored, err := domain.RestoreGame(snapshot)
	if err != nil {
		t.Fatal(err)
	}
	snapshot.Players[0].Scores[1] = domain.RecordedScore{Value: 8}
	if restored.Snapshot().Players[0].Scores[1].Value != 0 {
		t.Fatal("restored state aliases input")
	}
	invalid := original.Snapshot()
	invalid.Players[0].Scores[0] = domain.RecordedScore{Value: 2}
	if _, err := domain.RestoreGame(invalid); err == nil {
		t.Fatal("restored invalid hole")
	}
	invalid = original.Snapshot()
	invalid.Players[0].Name = " "
	if _, err := domain.RestoreGame(invalid); err == nil {
		t.Fatal("restored blank player")
	}
}

func TestCourseAndPubRouteAreDefensiveValues(t *testing.T) {
	game := newGame(t)
	course := domain.DefaultCourse()
	changed, _, err := game.SetCourse("host", course)
	if err != nil {
		t.Fatal(err)
	}
	holes := course.Holes()
	holes[0].Drinks[0].Name = "Changed"
	if changed.Course().Holes()[0].Drinks[0].Name != "Tequila" {
		t.Fatal("course aliases input")
	}
	pubs := make([]domain.PubSnapshot, 9)
	for index := range pubs {
		pubs[index] = domain.PubSnapshot{Name: "Pub", Latitude: 51, Longitude: 0.1}
	}
	geometry := &domain.PubRouteGeometry{Type: "LineString", Coordinates: [][]float64{{0.1, 51}, {0.2, 52}}}
	route, err := domain.NewPubRoute(pubs, geometry)
	if err != nil {
		t.Fatal(err)
	}
	routed, _, err := game.SetPubRoute("host", route)
	if err != nil {
		t.Fatal(err)
	}
	geometry.Coordinates[0][0] = 99
	pubs[0].Name = "Changed"
	snapshot := routed.Snapshot()
	snapshot.PubRoute.Geometry.Coordinates[1][0] = 99
	state := routed.Snapshot()
	if state.PubRoute.Pubs[0].Name != "Pub" || state.PubRoute.Geometry.Coordinates[0][0] != 0.1 ||
		state.PubRoute.Geometry.Coordinates[1][0] != 0.2 {
		t.Fatal("pub route aliases input or snapshot")
	}
}

func TestAggregateRejectsUninitialisedValues(t *testing.T) {
	game := newGame(t)
	if _, _, err := game.SubmitScore("host", domain.HoleNumber{}, domain.Score{}, "", time.Now()); err == nil {
		t.Fatal("accepted uninitialised hole")
	}
	if _, _, err := game.SetCourse("host", domain.Course{}); err == nil {
		t.Fatal("accepted empty course")
	}
	if _, _, err := game.SetPubRoute("host", domain.PubRoute{}); err == nil {
		t.Fatal("accepted empty route")
	}
	if _, err := game.WithVersion(-1); err == nil {
		t.Fatal("accepted invalid version")
	}
}
