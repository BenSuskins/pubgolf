package memory

import (
	"context"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"strings"
	"sync"
)

type Games struct {
	mutex    sync.Mutex
	games    map[string]domain.Game
	failures []error
}

func New() *Games { return &Games{games: map[string]domain.Game{}} }
func (repository *Games) FailNext(err error) {
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	repository.failures = append(repository.failures, err)
}
func (repository *Games) Get(ctx context.Context, code string) (domain.Game, error) {
	if err := ctx.Err(); err != nil {
		return domain.Game{}, err
	}
	repository.mutex.Lock()
	defer repository.mutex.Unlock()
	game, exists := repository.games[strings.ToLower(code)]
	if !exists {
		return domain.Game{}, domain.Fail(domain.NotFound, fmt.Sprintf("Game `%s` not found.", code))
	}
	return domain.Clone(game), nil
}
func (repository *Games) Save(ctx context.Context, game domain.Game, expected int64) (domain.Game, error) {
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
	key := strings.ToLower(game.Code)
	current, exists := repository.games[key]
	if expected == 0 && exists {
		return domain.Game{}, domain.Fail(domain.DuplicateCode, "Duplicate game code")
	}
	if expected > 0 && (!exists || current.Version != expected) {
		return domain.Game{}, domain.Fail(domain.StaleVersion, "Game was modified concurrently.")
	}
	game = domain.Clone(game)
	game.Version = expected + 1
	repository.games[key] = game
	return domain.Clone(game), nil
}

type Effects struct {
	Games   []domain.Game
	Events  []domain.Event
	Failure error
}

func (effects *Effects) Committed(_ context.Context, game domain.Game, events []domain.Event) error {
	effects.Games = append(effects.Games, domain.Clone(game))
	effects.Events = append(effects.Events, events...)
	return effects.Failure
}
