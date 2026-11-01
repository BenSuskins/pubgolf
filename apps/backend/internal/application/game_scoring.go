package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (commands *GameCommands) SubmitScore(
	ctx context.Context,
	code, actor string,
	hole, score int,
	penalty string,
) (domain.Game, error) {
	number, err := domain.NewHoleNumber(hole)
	if err != nil {
		return domain.Game{}, err
	}
	value, err := domain.NewScore(score)
	if err != nil {
		return domain.Game{}, err
	}
	at := commands.dependencies.Now()
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.SubmitScore(actor, number, value, penalty, at)
	})
}

func (commands *GameCommands) RandomisePlayer(ctx context.Context, code, actor string) (domain.Game, error) {
	outcome := commands.dependencies.ChooseRandomiseOutcome()
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.Randomise(actor, outcome)
	})
}
