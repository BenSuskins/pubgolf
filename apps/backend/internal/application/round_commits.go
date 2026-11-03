package application

import (
	"context"
	"errors"
	"log/slog"
	"sync"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type (
	roundCommitCoordinator struct {
		repository RoundRepository
		events     DomainEventPublisher
		states     RoundStatePublisher
		mutex      sync.Mutex
	}
	roundTransition func(domain.Round) (domain.Round, []domain.DomainEvent, error)
)

func hasKind(err error, kind domain.FailureKind) bool {
	var failure *domain.Failure
	return errors.As(err, &failure) && failure.Kind == kind
}

func (coordinator *roundCommitCoordinator) update(
	ctx context.Context,
	code string,
	transition roundTransition,
) (domain.Round, error) {
	coordinator.mutex.Lock()
	defer coordinator.mutex.Unlock()
	for attempt := 0; attempt < 3; attempt++ {
		if err := ctx.Err(); err != nil {
			return domain.Round{}, err
		}
		original, err := coordinator.repository.FindByCode(ctx, code)
		if err != nil {
			return domain.Round{}, err
		}
		updated, events, err := transition(original)
		if err != nil {
			return domain.Round{}, err
		}
		if len(events) == 0 {
			return updated, nil
		}
		saved, err := coordinator.repository.Save(ctx, updated, original.Version())
		if hasKind(err, domain.StaleVersion) {
			continue
		}
		if err != nil {
			return domain.Round{}, err
		}
		coordinator.publish(ctx, saved, events)
		return saved, nil
	}
	return domain.Round{}, domain.Fail(domain.Conflict, "Game was modified concurrently.")
}

func (coordinator *roundCommitCoordinator) publish(
	ctx context.Context,
	game domain.Round,
	events []domain.DomainEvent,
) {
	if coordinator.events != nil {
		if err := coordinator.events.PublishDomainEvents(ctx, events); err != nil {
			slog.Error("Committed domain event publication failed", "game", game.Code(), "error", err)
		}
	}
	if coordinator.states != nil {
		if err := coordinator.states.PublishRoundState(ctx, game.Snapshot()); err != nil {
			slog.Error("Committed game state publication failed", "game", game.Code(), "error", err)
		}
	}
}
