package application

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type Games interface {
	Get(context.Context, string) (domain.Game, error)
	Save(context.Context, domain.Game, int64) (domain.Game, error)
}
type Effects interface {
	Committed(context.Context, domain.Game, []domain.Event) error
}
type Router interface {
	Calculate(context.Context, []domain.Pub) (*domain.Geometry, error)
}
type Places interface {
	Search(context.Context, string, *float64, *float64) ([]domain.Place, error)
}
type Subscription struct {
	Updates <-chan domain.Game
	Cancel  func()
}
type (
	Streams      interface{ Subscribe(string) Subscription }
	Dependencies struct {
		Identifier func() string
		Code       func() string
		Outcome    func() string
		Now        func() time.Time
		Effects    Effects
		Router     Router
		Places     Places
		Streams    Streams
	}
)

type Service struct {
	games        Games
	dependencies Dependencies
	commits      sync.Mutex
}

func New(games Games, dependencies Dependencies) *Service {
	return &Service{games: games, dependencies: dependencies}
}

func (service *Service) Get(ctx context.Context, code string) (domain.Game, error) {
	return service.games.Get(ctx, code)
}

func (service *Service) notify(ctx context.Context, game domain.Game, events []domain.Event) {
	if service.dependencies.Effects != nil {
		if err := service.dependencies.Effects.Committed(ctx, game, events); err != nil {
			slog.Error("Committed game notification failed", "game", game.Code, "error", err)
		}
	}
}

func hasKind(err error, kind domain.FailureKind) bool {
	var failure *domain.Failure
	return errors.As(err, &failure) && failure.Kind == kind
}

func (service *Service) Create(ctx context.Context, name string) (domain.Game, error) {
	if err := domain.ValidateName(name, "host"); err != nil {
		return domain.Game{}, err
	}
	identifier, actor := service.dependencies.Identifier(), service.dependencies.Identifier()
	service.commits.Lock()
	defer service.commits.Unlock()
	var err error
	for attempt := 0; attempt < 5; attempt++ {
		game := domain.NewGame(identifier, service.dependencies.Code(), actor, name)
		saved, failure := service.games.Save(ctx, game, 0)
		err = failure
		if err == nil {
			service.notify(ctx, saved, []domain.Event{{Kind: domain.GameCreated}})
			return saved, nil
		}
		if !hasKind(err, domain.DuplicateCode) {
			return domain.Game{}, err
		}
	}
	return domain.Game{}, err
}

type change func(domain.Game) (domain.Game, []domain.Event, error)

func (service *Service) update(ctx context.Context, code string, change change) (domain.Game, error) {
	service.commits.Lock()
	defer service.commits.Unlock()
	for attempt := 0; attempt < 3; attempt++ {
		original, err := service.games.Get(ctx, code)
		if err != nil {
			return domain.Game{}, err
		}
		updated, events, err := change(original)
		if err != nil {
			return domain.Game{}, err
		}
		if len(events) == 0 {
			return updated, nil
		}
		saved, err := service.games.Save(ctx, updated, original.Version)
		if hasKind(err, domain.StaleVersion) {
			continue
		}
		if err != nil {
			return domain.Game{}, err
		}
		service.notify(ctx, saved, events)
		return saved, nil
	}
	return domain.Game{}, domain.Fail(domain.Conflict, "Game was modified concurrently.")
}

func (service *Service) Join(ctx context.Context, code, name string, rejoin bool) (domain.Game, error) {
	identifier := service.dependencies.Identifier()
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.Join(game, name, identifier, rejoin)
	})
}

func (service *Service) SubmitScore(
	ctx context.Context,
	code, actor string,
	hole, score int,
	penalty string,
) (domain.Game, error) {
	at := service.dependencies.Now()
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.SubmitScore(game, actor, hole, score, penalty, at)
	})
}

func (service *Service) Complete(ctx context.Context, code, actor string) (domain.Game, error) {
	return service.update(
		ctx,
		code,
		func(game domain.Game) (domain.Game, []domain.Event, error) { return domain.Complete(game, actor) },
	)
}

func (service *Service) Randomise(ctx context.Context, code, actor string) (domain.Game, error) {
	outcome := service.dependencies.Outcome()
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.RandomisePlayer(game, actor, outcome)
	})
}

func (service *Service) ActivateEvent(ctx context.Context, code, actor, identifier string) (domain.Game, error) {
	event := domain.ActiveEvent{ID: identifier, ActivatedAt: service.dependencies.Now()}
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.ActivateEvent(game, actor, event)
	})
}

func (service *Service) CustomEvent(ctx context.Context, code, actor, title, description string) (domain.Game, error) {
	event := domain.ActiveEvent{
		ID:          "custom",
		Title:       title,
		Description: description,
		ActivatedAt: service.dependencies.Now(),
	}
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.ActivateEvent(game, actor, event)
	})
}

func (service *Service) EndEvent(ctx context.Context, code, actor string) (domain.Game, error) {
	return service.update(
		ctx,
		code,
		func(game domain.Game) (domain.Game, []domain.Event, error) { return domain.EndEvent(game, actor) },
	)
}

func (service *Service) SetCourse(
	ctx context.Context,
	code, actor string,
	course []domain.CourseHole,
) (domain.Game, error) {
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.SetCourse(game, actor, course)
	})
}

func (service *Service) SetPubs(ctx context.Context, code, actor string, pubs []domain.Pub) (domain.Game, error) {
	original, err := service.Get(ctx, code)
	if err != nil {
		return domain.Game{}, err
	}
	validated, _, err := domain.SetPubs(original, actor, pubs, nil)
	if err != nil {
		return domain.Game{}, err
	}
	var route *domain.Geometry
	if service.dependencies.Router != nil {
		route, err = service.dependencies.Router.Calculate(ctx, validated.Pubs)
		if err != nil {
			slog.Warn("Route calculation failed; saving pubs without geometry", "error", err)
		}
	}
	if ctx.Err() != nil {
		return domain.Game{}, ctx.Err()
	}
	return service.update(ctx, code, func(game domain.Game) (domain.Game, []domain.Event, error) {
		return domain.SetPubs(game, actor, validated.Pubs, route)
	})
}

func (service *Service) Search(
	ctx context.Context,
	query string,
	latitude, longitude *float64,
) ([]domain.Place, error) {
	if len([]rune(query)) < 1 || len([]rune(query)) > 200 {
		return nil, domain.Fail(domain.Invalid, "Validation failed: Query must be between 1 and 200 characters")
	}
	if service.dependencies.Places == nil {
		return nil, domain.Fail(domain.Unavailable, "Failed to search places")
	}
	return service.dependencies.Places.Search(ctx, query, latitude, longitude)
}

// Local commits and stream snapshots share a lock so a new subscriber cannot miss a committed update.
func (service *Service) Subscribe(ctx context.Context, code string) (domain.Game, Subscription, error) {
	service.commits.Lock()
	defer service.commits.Unlock()
	game, err := service.games.Get(ctx, code)
	if err != nil {
		return domain.Game{}, Subscription{}, err
	}
	if service.dependencies.Streams == nil {
		return domain.Game{}, Subscription{}, domain.Fail(domain.Unavailable, "Live updates unavailable")
	}
	return game, service.dependencies.Streams.Subscribe(strings.ToLower(game.Code)), nil
}
