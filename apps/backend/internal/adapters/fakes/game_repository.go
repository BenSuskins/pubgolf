package fakes

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type RoundRepository struct {
	mutex    sync.Mutex
	games    map[string]domain.Round
	failures []error
}

func NewRoundRepository() *RoundRepository {
	return &RoundRepository{games: map[string]domain.Round{}}
}

func (repository *RoundRepository) FailNext(err error) {
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	repository.failures = append(repository.failures, err)
}

func (repository *RoundRepository) FindByCode(ctx context.Context, code string) (domain.Round, error) {
	if err := ctx.Err(); err != nil {
		return domain.Round{}, err
	}
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	game, exists := repository.games[strings.ToLower(code)]
	if !exists {
		return domain.Round{}, domain.Fail(domain.NotFound, fmt.Sprintf("Game `%s` not found.", code))
	}
	return game, nil
}

func (repository *RoundRepository) Save(ctx context.Context, game domain.Round, expected int64) (domain.Round, error) {
	if err := ctx.Err(); err != nil {
		return domain.Round{}, err
	}
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	if len(repository.failures) > 0 {
		err := repository.failures[0]
		repository.failures = repository.failures[1:]
		return domain.Round{}, err
	}
	key := strings.ToLower(game.Code())
	current, exists := repository.games[key]
	if expected == 0 && exists {
		return domain.Round{}, domain.Fail(domain.DuplicateCode, "Duplicate game code")
	}
	if expected > 0 && (!exists || current.Version() != expected) {
		return domain.Round{}, domain.Fail(domain.StaleVersion, "Game was modified concurrently.")
	}
	versioned, err := game.WithVersion(expected + 1)
	if err != nil {
		return domain.Round{}, err
	}
	game = versioned
	repository.games[key] = game
	return game, nil
}
