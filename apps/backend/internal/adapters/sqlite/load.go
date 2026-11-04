package sqlite

import (
	"context"
	"fmt"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"github.com/jmoiron/sqlx"
)

func loadGame(ctx context.Context, transaction *sqlx.Tx, code string) (domain.Round, error) {
	var record gameRecord
	err := transaction.GetContext(
		ctx,
		&record,
		"SELECT id,code,status,host_player_id,version,active_event,route FROM games WHERE code=? COLLATE NOCASE",
		code,
	)
	if err != nil {
		return domain.Round{}, gameNotFound(code, err)
	}
	game := domain.RoundSnapshot{
		ID:           record.ID,
		Code:         record.Code,
		Status:       record.Status,
		HostPlayerID: record.HostPlayerID,
		Version:      record.Version,
	}
	if err = loadStoredEvent(record.ActiveEvent, &game.ActiveGameplayEvent); err != nil {
		return domain.Round{}, err
	}
	if err = loadStoredGeometry(record.Route, &game.PubRoute.Geometry); err != nil {
		return domain.Round{}, err
	}
	game.Players, err = loadPlayers(ctx, transaction, game.ID)
	if err != nil {
		return domain.Round{}, err
	}
	game.Holes, err = loadHoles(ctx, transaction, game.ID)
	if err != nil {
		return domain.Round{}, err
	}
	game.PubRoute.Pubs, err = loadPubs(ctx, transaction, game.ID)
	if err != nil {
		return domain.Round{}, err
	}
	restored, err := domain.RestoreRound(game)
	if err != nil {
		return domain.Round{}, fmt.Errorf("restore persisted game %q: %v", record.Code, err)
	}
	return restored, nil
}

func loadPlayers(ctx context.Context, transaction *sqlx.Tx, gameID string) ([]domain.PlayerSnapshot, error) {
	var records []playerRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT id,name,randomise FROM players WHERE game_id=? ORDER BY position",
		gameID,
	); err != nil {
		return nil, err
	}
	var players []domain.PlayerSnapshot
	for _, record := range records {
		player, err := loadPlayer(ctx, transaction, record)
		if err != nil {
			return nil, err
		}
		players = append(players, player)
	}
	return players, nil
}

func loadPlayer(ctx context.Context, transaction *sqlx.Tx, record playerRecord) (domain.PlayerSnapshot, error) {
	player := domain.PlayerSnapshot{
		ID:        record.ID,
		Name:      record.Name,
		Scores:    map[int]domain.RecordedScore{},
		Penalties: map[int]string{},
	}
	if err := loadStoredRandomise(record.Randomise, &player.Wildcard); err != nil {
		return player, err
	}
	var records []scoreRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT hole,score,modified,penalty FROM scores WHERE player_id=? ORDER BY hole",
		player.ID,
	); err != nil {
		return player, err
	}
	for _, score := range records {
		at, err := time.Parse(time.RFC3339Nano, score.Modified)
		if err != nil {
			return player, err
		}
		player.Scores[score.Hole] = domain.RecordedScore{Value: score.Value, At: at}
		if score.Penalty != "" {
			player.Penalties[score.Hole] = score.Penalty
		}
	}
	return player, nil
}

func loadHoles(ctx context.Context, transaction *sqlx.Tx, gameID string) ([]domain.CourseHoleSnapshot, error) {
	var records []holeRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT hole,par,drinks FROM holes WHERE game_id=? ORDER BY hole",
		gameID,
	); err != nil {
		return nil, err
	}
	var holes []domain.CourseHoleSnapshot
	for _, record := range records {
		hole := domain.CourseHoleSnapshot{Hole: record.Hole, Par: record.Par}
		if err := loadStoredDrinks(record.Drinks, &hole.Drinks); err != nil {
			return nil, err
		}
		holes = append(holes, hole)
	}
	return holes, nil
}

func loadPubs(ctx context.Context, transaction *sqlx.Tx, gameID string) ([]domain.PubSnapshot, error) {
	var records []pubRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT hole,name,latitude,longitude FROM pubs WHERE game_id=? ORDER BY hole",
		gameID,
	); err != nil {
		return nil, err
	}
	var pubs []domain.PubSnapshot
	for _, record := range records {
		pubs = append(
			pubs,
			domain.PubSnapshot{
				Hole:      record.Hole,
				Name:      record.Name,
				Latitude:  record.Latitude,
				Longitude: record.Longitude,
			},
		)
	}
	return pubs, nil
}
