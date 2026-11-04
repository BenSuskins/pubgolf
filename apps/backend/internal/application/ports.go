package application

import (
	"context"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type RoundRepository interface {
	FindByCode(context.Context, string) (domain.Round, error)
	Save(context.Context, domain.Round, int64) (domain.Round, error)
}
type (
	DomainEventPublisher interface {
		PublishDomainEvents(context.Context, []domain.DomainEvent) error
	}
	RoundStatePublisher interface {
		PublishRoundState(context.Context, domain.RoundSnapshot) error
	}
	RoundStateSubscriber interface {
		SubscribeRoundState(string) RoundStateSubscription
	}
	RoundStateSubscription struct {
		Updates <-chan domain.RoundSnapshot
		Cancel  func()
	}
	PubRouteCalculator interface {
		CalculatePubRoute(context.Context, domain.PubRoute) (domain.PubRoute, error)
	}
	PlaceSearcher interface {
		SearchPlaces(context.Context, string, *float64, *float64) ([]domain.Place, error)
	}
	RoundDependencies struct {
		NewRoundID            func() string
		NewPlayerID           func() string
		NewRoundCode          func() string
		ChooseWildcardOutcome func() string
		Now                   func() time.Time
		DomainEvents          DomainEventPublisher
		RoundStates           RoundStatePublisher
		Subscriptions         RoundStateSubscriber
		PubRoutes             PubRouteCalculator
	}
)

type RoundApplication struct {
	Commands      *RoundCommands
	Queries       *RoundQueries
	Subscriptions *RoundSubscriptions
}

func NewRoundApplication(repository RoundRepository, dependencies RoundDependencies) RoundApplication {
	coordinator := &roundCommitCoordinator{
		repository: repository,
		events:     dependencies.DomainEvents,
		states:     dependencies.RoundStates,
	}
	return RoundApplication{
		Commands:      &RoundCommands{coordinator: coordinator, dependencies: dependencies},
		Queries:       &RoundQueries{repository: repository},
		Subscriptions: &RoundSubscriptions{coordinator: coordinator, subscriber: dependencies.Subscriptions},
	}
}
