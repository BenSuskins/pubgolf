package application

import (
	"context"
	"strings"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type RoundSubscriptions struct {
	coordinator *roundCommitCoordinator
	subscriber  RoundStateSubscriber
}

func (subscriptions *RoundSubscriptions) SubscribeRound(
	ctx context.Context,
	code string,
) (domain.RoundSnapshot, RoundStateSubscription, error) {
	coordinator := subscriptions.coordinator
	coordinator.mutex.Lock()
	defer coordinator.mutex.Unlock()
	game, err := coordinator.repository.FindByCode(ctx, code)
	if err != nil {
		return domain.RoundSnapshot{}, RoundStateSubscription{}, err
	}
	if subscriptions.subscriber == nil {
		return domain.RoundSnapshot{}, RoundStateSubscription{}, domain.Fail(
			domain.Unavailable,
			"Live updates unavailable",
		)
	}
	return game.Snapshot(), subscriptions.subscriber.SubscribeRoundState(strings.ToLower(game.Code())), nil
}
