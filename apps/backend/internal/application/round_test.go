package application_test

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/adapters/fakes"
	"github.com/BenSuskins/pubgolf/backend/internal/adapters/roundupdates"
	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type gameFixture struct {
	app             application.RoundApplication
	repository      *fakes.RoundRepository
	events          *fakes.DomainEventPublisher
	states          *fakes.RoundStatePublisher
	choices         int
	clockReads      int
	identifierReads int
}

func fixture() *gameFixture {
	result := &gameFixture{
		repository: fakes.NewRoundRepository(),
		events:     &fakes.DomainEventPublisher{},
		states:     &fakes.RoundStatePublisher{},
	}
	result.app = application.NewRoundApplication(result.repository, result.dependencies())
	return result
}

func (fixture *gameFixture) dependencies() application.RoundDependencies {
	return application.RoundDependencies{
		NewRoundID:            func() string { return "game" },
		NewPlayerID:           fixture.newPlayerID,
		NewRoundCode:          func() string { return "PAR001" },
		Now:                   func() time.Time { fixture.clockReads++; return time.Unix(42, 0).UTC() },
		ChooseWildcardOutcome: func() string { fixture.choices++; return "Tequila" },
		DomainEvents:          fixture.events,
		RoundStates:           fixture.states,
	}
}

func (fixture *gameFixture) newPlayerID() string {
	fixture.identifierReads++
	if fixture.identifierReads == 1 {
		return "host"
	}
	return fmt.Sprintf("player%d", fixture.identifierReads)
}

func create(t *testing.T, fixture *gameFixture) domain.Round {
	t.Helper()
	game, err := fixture.app.Commands.CreateRound(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}
	return game
}

func TestCreatedGameCanBeReadAndPlayed(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	_, err := fixture.app.Commands.SubmitScore(context.Background(), game.Code(), "host", 1, 0, "")
	if err != nil {
		t.Fatal(err)
	}
	loaded, err := fixture.app.Queries.GetRound(context.Background(), "par001")
	if err != nil || loaded.Players[0].Scores[1].Value != 0 || len(loaded.Players[0].Scores) != 1 {
		t.Fatal(loaded, err)
	}
	if _, ok := fixture.events.Events[0].(domain.RoundCreated); !ok {
		t.Fatal("creation fact missing")
	}
	if _, ok := fixture.events.Events[1].(domain.ScoreSubmitted); !ok {
		t.Fatal("score fact missing")
	}
}

func TestFailedSaveDoesNotPublishAndConflictRetriesReuseRandomChoice(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	before := len(fixture.states.Snapshots)
	fixture.repository.FailNext(domain.Fail(domain.StaleVersion, "conflict"))
	changed, err := fixture.app.Commands.UseWildcard(context.Background(), game.Code(), "host")
	if err != nil || fixture.choices != 1 || len(fixture.states.Snapshots) != before+1 ||
		changed.Snapshot().Players[0].Wildcard.Result != "Tequila" {
		t.Fatal(changed, err)
	}
	fixture.repository.FailNext(domain.Fail(domain.Unavailable, "disk unavailable"))
	before = len(fixture.states.Snapshots)
	eventCount := len(fixture.events.Events)
	if _, err = fixture.app.Commands.SubmitScore(context.Background(), game.Code(), "host", 1, 1, ""); err == nil {
		t.Fatal("save should fail")
	}
	if len(fixture.states.Snapshots) != before || len(fixture.events.Events) != eventCount {
		t.Fatal("published failed write")
	}
}

func TestRetryExhaustionAndCommandTimeIsStable(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	for attempt := 0; attempt < 3; attempt++ {
		fixture.repository.FailNext(domain.Fail(domain.StaleVersion, "conflict"))
	}
	if _, err := fixture.app.Commands.SubmitScore(context.Background(), game.Code(), "host", 1, 1, ""); err == nil {
		t.Fatal("retry limit ignored")
	}
	loaded, _ := fixture.app.Queries.GetRound(context.Background(), game.Code())
	if len(loaded.Players[0].Scores) != 0 || len(fixture.events.Events) != 1 || len(fixture.states.Snapshots) != 1 {
		t.Fatal("failed update produced effects")
	}
	if fixture.clockReads != 1 {
		t.Fatal("timestamp generated during retries")
	}
}

func TestPublisherFailuresAreIndependentAndDoNotUndoCommit(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	fixture.events.Failure = fmt.Errorf("event delivery failed")
	if _, err := fixture.app.Commands.SubmitScore(context.Background(), game.Code(), "host", 1, 2, ""); err != nil {
		t.Fatal(err)
	}
	if len(fixture.states.Snapshots) != 2 {
		t.Fatal("failed event publisher prevented snapshot publication")
	}
	fixture.states.Failure = fmt.Errorf("snapshot delivery failed")
	if _, err := fixture.app.Commands.SubmitScore(context.Background(), game.Code(), "host", 1, 3, ""); err != nil {
		t.Fatal(err)
	}
	loaded, _ := fixture.app.Queries.GetRound(context.Background(), game.Code())
	if loaded.Players[0].Scores[1].Value != 3 || len(fixture.events.Events) != 3 {
		t.Fatal("committed state or facts lost")
	}
}

func TestNoOpCommandsDoNotSaveOrPublish(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	joined, err := fixture.app.Commands.JoinRound(context.Background(), game.Code(), "aLICE", true)
	if err != nil {
		t.Fatal(err)
	}
	ended, err := fixture.app.Commands.EndGameplayEvent(context.Background(), game.Code(), "host")
	if err != nil {
		t.Fatal(err)
	}
	if joined.Version() != game.Version() || ended.Version() != game.Version() || len(fixture.events.Events) != 1 ||
		len(fixture.states.Snapshots) != 1 {
		t.Fatal("no-op command changed state or effects")
	}
}

func TestConcurrentSubscriptionsSeeEveryLaterCommittedVersion(t *testing.T) {
	fixture := fixture()
	broadcaster := roundupdates.New(32)
	defer broadcaster.Close()
	dependencies := fixture.dependencies()
	dependencies.Now = func() time.Time { return time.Unix(42, 0).UTC() }
	dependencies.RoundStates = broadcaster
	dependencies.Subscriptions = broadcaster
	fixture.app = application.NewRoundApplication(fixture.repository, dependencies)
	game := create(t, fixture)
	var workers sync.WaitGroup
	for index := 0; index < 12; index++ {
		workers.Go(func() { verifySubscription(t, fixture.app, game.Code()) })
	}
	workers.Wait()
}

func verifySubscription(t *testing.T, app application.RoundApplication, code string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	initial, subscription, err := app.Subscriptions.SubscribeRound(ctx, code)
	if err != nil {
		t.Error(err)
		return
	}
	defer subscription.Cancel()
	changed, err := app.Commands.SubmitScore(ctx, code, "host", 1, 2, "")
	if err != nil {
		t.Error(err)
		return
	}
	previous := initial.Version
	for {
		select {
		case snapshot := <-subscription.Updates:
			if snapshot.Version <= previous {
				t.Error("snapshots regressed")
				return
			}
			previous = snapshot.Version
			if snapshot.Version == changed.Version() {
				return
			}
		case <-ctx.Done():
			t.Error("subscription missed committed state")
			return
		}
	}
}
