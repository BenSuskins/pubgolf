package fakes

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type GameRepository struct {
	mutex    sync.Mutex
	games    map[string]domain.Game
	failures []error
}

func NewGameRepository() *GameRepository { return &GameRepository{games: map[string]domain.Game{}} }
func (repository *GameRepository) FailNext(err error) {
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	repository.failures = append(repository.failures, err)
}

func (repository *GameRepository) FindByCode(ctx context.Context, code string) (domain.Game, error) {
	if err := ctx.Err(); err != nil {
		return domain.Game{}, err
	}
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	game, exists := repository.games[strings.ToLower(code)]
	if !exists {
		return domain.Game{}, domain.Fail(domain.NotFound, fmt.Sprintf("Game `%s` not found.", code))
	}
	return game, nil
}

func (repository *GameRepository) Save(ctx context.Context, game domain.Game, expected int64) (domain.Game, error) {
	if err := ctx.Err(); err != nil {
		return domain.Game{}, err
	}
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	if len(repository.failures) > 0 {
		err := repository.failures[0]
		repository.failures = repository.failures[1:]
		return domain.Game{}, err
	}
	key := strings.ToLower(game.Code())
	current, exists := repository.games[key]
	if expected == 0 && exists {
		return domain.Game{}, domain.Fail(domain.DuplicateCode, "Duplicate game code")
	}
	if expected > 0 && (!exists || current.Version() != expected) {
		return domain.Game{}, domain.Fail(domain.StaleVersion, "Game was modified concurrently.")
	}
	versioned, err := game.WithVersion(expected + 1)
	if err != nil {
		return domain.Game{}, err
	}
	game = versioned
	repository.games[key] = game
	return game, nil
}
