package bootstrap

import (
	"context"
	"errors"
	"log/slog"

	"github.com/BenSuskins/pubgolf/backend/internal/application"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type committedEffects []application.Effects

func (adapters committedEffects) Committed(ctx context.Context, game domain.Game, events []domain.Event) error {
	for _, event := range events {
		slog.Info("Game action committed", "game", game.Code, "event", event.Kind)
	}
	var failures []error
	for _, adapter := range adapters {
		if err := adapter.Committed(ctx, game, events); err != nil {
			failures = append(failures, err)
		}
	}
	return errors.Join(failures...)
}
