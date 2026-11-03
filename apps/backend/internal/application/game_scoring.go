package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func (commands *RoundCommands) SubmitScore(
	ctx context.Context,
	code, actor string,
	hole, score int,
	penalty string,
) (domain.Round, error) {
	number, err := domain.NewHoleNumber(hole)
	if err != nil {
		return domain.Round{}, err
	}
	value, err := domain.NewScore(score)
	if err != nil {
		return domain.Round{}, err
	}
	at := commands.dependencies.Now()
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.SubmitScore(actor, number, value, penalty, at)
	})
}

func (commands *RoundCommands) UseWildcard(ctx context.Context, code, actor string) (domain.Round, error) {
	outcome := commands.dependencies.ChooseWildcardOutcome()
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.UseWildcard(actor, outcome)
	})
}
