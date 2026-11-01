package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type GameQueries struct{ repository GameRepository }

func (queries *GameQueries) GetGame(ctx context.Context, code string) (domain.GameSnapshot, error) {
	game, err := queries.repository.FindByCode(ctx, code)
	if err != nil {
		return domain.GameSnapshot{}, err
	}
	return game.Snapshot(), nil
}
