package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (commands *GameCommands) ActivateGameplayEvent(
	ctx context.Context,
	code, actor, identifier string,
) (domain.Game, error) {
	at := commands.dependencies.Now()
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.ActivateGameplayEvent(actor, identifier, at)
	})
}

func (commands *GameCommands) ActivateCustomGameplayEvent(
	ctx context.Context,
	code, actor, title, description string,
) (domain.Game, error) {
	at := commands.dependencies.Now()
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.ActivateCustomGameplayEvent(actor, title, description, at)
	})
}

func (commands *GameCommands) EndGameplayEvent(ctx context.Context, code, actor string) (domain.Game, error) {
	return commands.coordinator.update(
		ctx,
		code,
		func(game domain.Game) (domain.Game, []domain.DomainEvent, error) { return game.EndGameplayEvent(actor) },
	)
}
