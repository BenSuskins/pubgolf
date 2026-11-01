package application

import (
	"context"
	"errors"
	"log/slog"
	"sync"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type (
	gameCommitCoordinator struct {
		repository GameRepository
		events     DomainEventPublisher
		states     GameStatePublisher
		mutex      sync.Mutex
	}
	gameTransition func(domain.Game) (domain.Game, []domain.DomainEvent, error)
)

func hasKind(err error, kind domain.FailureKind) bool {
	var failure *domain.Failure
	return errors.As(err, &failure) && failure.Kind == kind
}

func (coordinator *gameCommitCoordinator) update(
	ctx context.Context,
	code string,
	transition gameTransition,
) (domain.Game, error) {
	coordinator.mutex.Lock()
	defer coordinator.mutex.Unlock()
	for attempt := 0; attempt < 3; attempt++ {
		if err := ctx.Err(); err != nil {
			return domain.Game{}, err
		}
		original, err := coordinator.repository.FindByCode(ctx, code)
		if err != nil {
			return domain.Game{}, err
		}
		updated, events, err := transition(original)
		if err != nil {
			return domain.Game{}, err
		}
		if len(events) == 0 {
			return updated, nil
		}
		saved, err := coordinator.repository.Save(ctx, updated, original.Version())
		if hasKind(err, domain.StaleVersion) {
			continue
		}
		if err != nil {
			return domain.Game{}, err
		}
		coordinator.publish(ctx, saved, events)
		return saved, nil
	}
	return domain.Game{}, domain.Fail(domain.Conflict, "Game was modified concurrently.")
}

func (coordinator *gameCommitCoordinator) publish(ctx context.Context, game domain.Game, events []domain.DomainEvent) {
	if coordinator.events != nil {
		if err := coordinator.events.PublishDomainEvents(ctx, events); err != nil {
			slog.Error("Committed domain event publication failed", "game", game.Code(), "error", err)
		}
	}
	if coordinator.states != nil {
		if err := coordinator.states.PublishGameState(ctx, game.Snapshot()); err != nil {
			slog.Error("Committed game state publication failed", "game", game.Code(), "error", err)
		}
	}
}
