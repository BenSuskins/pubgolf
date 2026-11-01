package application

import (
	"context"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type GameSubscriptions struct {
	coordinator *gameCommitCoordinator
	subscriber  GameStateSubscriber
}

func (subscriptions *GameSubscriptions) SubscribeGame(
	ctx context.Context,
	code string,
) (domain.GameSnapshot, GameStateSubscription, error) {
	coordinator := subscriptions.coordinator
	coordinator.mutex.Lock()
	defer coordinator.mutex.Unlock()
	game, err := coordinator.repository.FindByCode(ctx, code)
	if err != nil {
		return domain.GameSnapshot{}, GameStateSubscription{}, err
	}
	if subscriptions.subscriber == nil {
		return domain.GameSnapshot{}, GameStateSubscription{}, domain.Fail(
			domain.Unavailable,
			"Live updates unavailable",
		)
	}
	return game.Snapshot(), subscriptions.subscriber.SubscribeGameState(strings.ToLower(game.Code())), nil
}
