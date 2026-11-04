package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (commands *RoundCommands) ActivateGameplayEvent(
	ctx context.Context,
	code, actor, identifier string,
) (domain.Round, error) {
	at := commands.dependencies.Now()
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.ActivateGameplayEvent(actor, identifier, at)
	})
}

func (commands *RoundCommands) ActivateCustomGameplayEvent(
	ctx context.Context,
	code, actor, title, description string,
) (domain.Round, error) {
	at := commands.dependencies.Now()
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.ActivateCustomGameplayEvent(actor, title, description, at)
	})
}

func (commands *RoundCommands) EndGameplayEvent(ctx context.Context, code, actor string) (domain.Round, error) {
	return commands.coordinator.update(
		ctx,
		code,
		func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
			return game.EndGameplayEvent(actor)
		},
	)
}
