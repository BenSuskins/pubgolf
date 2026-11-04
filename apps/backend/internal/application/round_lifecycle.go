package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type RoundCommands struct {
	coordinator  *roundCommitCoordinator
	dependencies RoundDependencies
}

func (commands *RoundCommands) CreateRound(ctx context.Context, name string) (domain.Round, error) {
	playerName, err := domain.NewPlayerName(name)
	if err != nil {
		return domain.Round{}, domain.Fail(domain.Invalid, "Validation failed: host: Host name must not be blank")
	}
	identifier, actor := commands.dependencies.NewRoundID(), commands.dependencies.NewPlayerID()
	coordinator := commands.coordinator
	coordinator.mutex.Lock()
	defer coordinator.mutex.Unlock()
	for attempt := 0; attempt < 5; attempt++ {
		if err = ctx.Err(); err != nil {
			return domain.Round{}, err
		}
		game, events, failure := domain.NewRound(identifier, commands.dependencies.NewRoundCode(), actor, playerName)
		if failure != nil {
			return domain.Round{}, failure
		}
		saved, failure := coordinator.repository.Save(ctx, game, 0)
		err = failure
		if err == nil {
			coordinator.publish(ctx, saved, events)
			return saved, nil
		}
		if !hasKind(err, domain.DuplicateCode) {
			return domain.Round{}, err
		}
	}
	return domain.Round{}, err
}

func (commands *RoundCommands) JoinRound(ctx context.Context, code, name string, rejoin bool) (domain.Round, error) {
	playerName, err := domain.NewPlayerName(name)
	if err != nil {
		return domain.Round{}, err
	}
	identifier := commands.dependencies.NewPlayerID()
	return commands.coordinator.update(ctx, code, func(game domain.Round) (domain.Round, []domain.DomainEvent, error) {
		return game.Join(playerName, identifier, rejoin)
	})
}

func (commands *RoundCommands) CompleteRound(ctx context.Context, code, actor string) (domain.Round, error) {
	return commands.coordinator.update(
		ctx,
		code,
		func(game domain.Round) (domain.Round, []domain.DomainEvent, error) { return game.Complete(actor) },
	)
}
