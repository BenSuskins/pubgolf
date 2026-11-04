package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type RoundQueries struct{ repository RoundRepository }

func (queries *RoundQueries) GetRound(ctx context.Context, code string) (domain.RoundSnapshot, error) {
	game, err := queries.repository.FindByCode(ctx, code)
	if err != nil {
		return domain.RoundSnapshot{}, err
	}
	return game.Snapshot(), nil
}
