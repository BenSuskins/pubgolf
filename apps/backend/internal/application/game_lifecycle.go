package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type GameCommands struct {
	coordinator  *gameCommitCoordinator
	dependencies GameDependencies
}

func (commands *GameCommands) CreateGame(ctx context.Context, name string) (domain.Game, error) {
	playerName, err := domain.NewPlayerName(name)
	if err != nil {
		return domain.Game{}, domain.Fail(domain.Invalid, "Validation failed: host: Host name must not be blank")
	}
	identifier, actor := commands.dependencies.NewGameID(), commands.dependencies.NewPlayerID()
	coordinator := commands.coordinator
	coordinator.mutex.Lock()
	defer coordinator.mutex.Unlock()
	for attempt := 0; attempt < 5; attempt++ {
		if err = ctx.Err(); err != nil {
			return domain.Game{}, err
		}
		game, events, failure := domain.NewGame(identifier, commands.dependencies.NewGameCode(), actor, playerName)
		if failure != nil {
			return domain.Game{}, failure
		}
		saved, failure := coordinator.repository.Save(ctx, game, 0)
		err = failure
		if err == nil {
			coordinator.publish(ctx, saved, events)
			return saved, nil
		}
		if !hasKind(err, domain.DuplicateCode) {
			return domain.Game{}, err
		}
	}
	return domain.Game{}, err
}

func (commands *GameCommands) JoinGame(ctx context.Context, code, name string, rejoin bool) (domain.Game, error) {
	playerName, err := domain.NewPlayerName(name)
	if err != nil {
		return domain.Game{}, err
	}
	identifier := commands.dependencies.NewPlayerID()
	return commands.coordinator.update(ctx, code, func(game domain.Game) (domain.Game, []domain.DomainEvent, error) {
		return game.Join(playerName, identifier, rejoin)
	})
}

func (commands *GameCommands) CompleteGame(ctx context.Context, code, actor string) (domain.Game, error) {
	return commands.coordinator.update(
		ctx,
		code,
		func(game domain.Game) (domain.Game, []domain.DomainEvent, error) { return game.Complete(actor) },
	)
}
