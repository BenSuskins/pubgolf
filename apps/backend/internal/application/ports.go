package application

import (
	"context"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type GameRepository interface {
	FindByCode(context.Context, string) (domain.Game, error)
	Save(context.Context, domain.Game, int64) (domain.Game, error)
}
type (
	DomainEventPublisher interface {
		PublishDomainEvents(context.Context, []domain.DomainEvent) error
	}
	GameStatePublisher interface {
		PublishGameState(context.Context, domain.GameSnapshot) error
	}
	GameStateSubscriber interface {
		SubscribeGameState(string) GameStateSubscription
	}
	GameStateSubscription struct {
		Updates <-chan domain.GameSnapshot
		Cancel  func()
	}
	PubRouteCalculator interface {
		CalculatePubRoute(context.Context, domain.PubRoute) (domain.PubRoute, error)
	}
	PlaceSearcher interface {
		SearchPlaces(context.Context, string, *float64, *float64) ([]domain.Place, error)
	}
	GameDependencies struct {
		NewGameID              func() string
		NewPlayerID            func() string
		NewGameCode            func() string
		ChooseRandomiseOutcome func() string
		Now                    func() time.Time
		DomainEvents           DomainEventPublisher
		GameStates             GameStatePublisher
		Subscriptions          GameStateSubscriber
		PubRoutes              PubRouteCalculator
	}
)

type GameApplication struct {
	Commands      *GameCommands
	Queries       *GameQueries
	Subscriptions *GameSubscriptions
}

func NewGameApplication(repository GameRepository, dependencies GameDependencies) GameApplication {
	coordinator := &gameCommitCoordinator{
		repository: repository,
		events:     dependencies.DomainEvents,
		states:     dependencies.GameStates,
	}
	return GameApplication{
		Commands:      &GameCommands{coordinator: coordinator, dependencies: dependencies},
		Queries:       &GameQueries{repository: repository},
		Subscriptions: &GameSubscriptions{coordinator: coordinator, subscriber: dependencies.Subscriptions},
	}
}
