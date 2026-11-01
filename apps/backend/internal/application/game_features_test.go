package application_test

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestGameCommandsPublishFactsForEveryFeature(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	ctx := context.Background()
	commands := fixture.app.Commands
	actions := gameFeatureActions(ctx, commands, game.Code())
	for _, action := range actions {
		t.Run(action.name, func(t *testing.T) {
			before := len(fixture.events.Events)
			saved, err := action.run()
			if err != nil {
				t.Fatal(err)
			}
			if len(fixture.events.Events) != before+1 || len(fixture.states.Snapshots) != before+1 {
				t.Fatal("command did not publish exactly one fact and snapshot")
			}
			if reflect.TypeOf(fixture.events.Events[before]) != reflect.TypeOf(action.fact) {
				t.Fatalf("unexpected fact: %T", fixture.events.Events[before])
			}
			if saved.Version() != fixture.states.Snapshots[before].Version {
				t.Fatal("published uncommitted state")
			}
		})
	}
}

type gameCommandCase struct {
	name string
	run  func() (domain.Game, error)
	fact domain.DomainEvent
}

func gameFeatureActions(ctx context.Context, commands *application.GameCommands, code string) []gameCommandCase {
	return []gameCommandCase{
		{
			"join",
			func() (domain.Game, error) { return commands.JoinGame(ctx, code, "Bob", false) },
			domain.PlayerJoined{},
		},
		{"course", func() (domain.Game, error) {
			return commands.SetCourse(ctx, code, "host", domain.DefaultCourse().Holes())
		}, domain.CourseChanged{}},
		{
			"pub route",
			func() (domain.Game, error) { return commands.SetPubRoute(ctx, code, "host", ninePubs()) },
			domain.PubRouteChanged{},
		},
		{"activate", func() (domain.Game, error) {
			return commands.ActivateGameplayEvent(ctx, code, "host", domain.AvailableGameplayEvents()[0].ID)
		}, domain.GameplayEventActivated{}},
		{
			"end event",
			func() (domain.Game, error) { return commands.EndGameplayEvent(ctx, code, "host") },
			domain.GameplayEventEnded{},
		},
		{"custom event", func() (domain.Game, error) {
			return commands.ActivateCustomGameplayEvent(ctx, code, "host", "Custom", "Description")
		}, domain.GameplayEventActivated{}},
		{
			"complete",
			func() (domain.Game, error) { return commands.CompleteGame(ctx, code, "host") },
			domain.GameCompleted{},
		},
	}
}

func ninePubs() []domain.PubSnapshot {
	pubs := make([]domain.PubSnapshot, 9)
	for index := range pubs {
		pubs[index] = domain.PubSnapshot{Name: "Pub", Latitude: 51.5, Longitude: -0.1}
	}
	return pubs
}

func TestGameCommandsEnforceMembershipAndHostPermissions(t *testing.T) {
	fixture := fixture()
	game := create(t, fixture)
	ctx := context.Background()
	if _, err := fixture.app.Commands.JoinGame(ctx, game.Code(), "Bob", false); err != nil {
		t.Fatal(err)
	}
	for _, actor := range []string{"outsider", "player2"} {
		verifyHostCommandsForbidden(t, fixture, game.Code(), actor)
	}
	before := len(fixture.events.Events)
	if _, err := fixture.app.Commands.SubmitScore(ctx, game.Code(), "outsider", 1, 1, ""); err == nil {
		t.Fatal("outsider scored")
	}
	if _, err := fixture.app.Commands.RandomisePlayer(ctx, game.Code(), "outsider"); err == nil {
		t.Fatal("outsider randomised")
	}
	if len(fixture.events.Events) != before {
		t.Fatal("forbidden commands published facts")
	}
}

func verifyHostCommandsForbidden(t *testing.T, fixture *gameFixture, code, actor string) {
	t.Helper()
	ctx := context.Background()
	commands := fixture.app.Commands
	actions := []func() (domain.Game, error){
		func() (domain.Game, error) {
			return commands.SetCourse(ctx, code, actor, domain.DefaultCourse().Holes())
		},
		func() (domain.Game, error) { return commands.SetPubRoute(ctx, code, actor, ninePubs()) },
		func() (domain.Game, error) { return commands.ActivateGameplayEvent(ctx, code, actor, "event") },
		func() (domain.Game, error) {
			return commands.ActivateCustomGameplayEvent(ctx, code, actor, "Custom", "Description")
		},
		func() (domain.Game, error) { return commands.EndGameplayEvent(ctx, code, actor) },
		func() (domain.Game, error) { return commands.CompleteGame(ctx, code, actor) },
	}
	before := len(fixture.events.Events)
	for _, action := range actions {
		_, err := action()
		var failure *domain.Failure
		if !errors.As(err, &failure) || failure.Kind != domain.Forbidden {
			t.Fatal("missing host check", err)
		}
	}
	if len(fixture.events.Events) != before || len(fixture.states.Snapshots) != before {
		t.Fatal("forbidden commands published effects")
	}
}
