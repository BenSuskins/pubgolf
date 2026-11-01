package sqlite

import (
	"context"
	"encoding/json"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"github.com/jmoiron/sqlx"
)

func loadGame(ctx context.Context, transaction *sqlx.Tx, code string) (domain.Game, error) {
	var record gameRecord
	err := transaction.GetContext(
		ctx,
		&record,
		"SELECT id,code,status,host_player_id,version,active_event,route FROM games WHERE code=? COLLATE NOCASE",
		code,
	)
	if err != nil {
		return domain.Game{}, gameNotFound(code, err)
	}
	game := domain.Game{
		ID:           record.ID,
		Code:         record.Code,
		Status:       record.Status,
		HostPlayerID: record.HostPlayerID,
		Version:      record.Version,
	}
	if err = decode(record.ActiveEvent, &game.ActiveEvent); err != nil {
		return game, err
	}
	if err = decode(record.Route, &game.Route); err != nil {
		return game, err
	}
	game.Players, err = loadPlayers(ctx, transaction, game.ID)
	if err != nil {
		return game, err
	}
	game.Holes, err = loadHoles(ctx, transaction, game.ID)
	if err != nil {
		return game, err
	}
	game.Pubs, err = loadPubs(ctx, transaction, game.ID)
	return game, err
}

func loadPlayers(ctx context.Context, transaction *sqlx.Tx, gameID string) ([]domain.Player, error) {
	var records []playerRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT id,name,randomise FROM players WHERE game_id=? ORDER BY position",
		gameID,
	); err != nil {
		return nil, err
	}
	var players []domain.Player
	for _, record := range records {
		player, err := loadPlayer(ctx, transaction, record)
		if err != nil {
			return nil, err
		}
		players = append(players, player)
	}
	return players, nil
}

func loadPlayer(ctx context.Context, transaction *sqlx.Tx, record playerRecord) (domain.Player, error) {
	player := domain.NewPlayer(record.ID, record.Name)
	if err := decode(record.Randomise, &player.Randomise); err != nil {
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
		player.Scores[score.Hole] = domain.Score{Value: score.Value, At: at}
		if score.Penalty != "" {
			player.Penalties[score.Hole] = score.Penalty
		}
	}
	return player, nil
}

func loadHoles(ctx context.Context, transaction *sqlx.Tx, gameID string) ([]domain.CourseHole, error) {
	var records []holeRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT hole,par,drinks FROM holes WHERE game_id=? ORDER BY hole",
		gameID,
	); err != nil {
		return nil, err
	}
	var holes []domain.CourseHole
	for _, record := range records {
		hole := domain.CourseHole{Hole: record.Hole, Par: record.Par}
		if err := json.Unmarshal([]byte(record.Drinks), &hole.Drinks); err != nil {
			return nil, err
		}
		holes = append(holes, hole)
	}
	return holes, nil
}

func loadPubs(ctx context.Context, transaction *sqlx.Tx, gameID string) ([]domain.Pub, error) {
	var records []pubRecord
	if err := transaction.SelectContext(
		ctx,
		&records,
		"SELECT hole,name,latitude,longitude FROM pubs WHERE game_id=? ORDER BY hole",
		gameID,
	); err != nil {
		return nil, err
	}
	var pubs []domain.Pub
	for _, record := range records {
		pubs = append(
			pubs,
			domain.Pub{Hole: record.Hole, Name: record.Name, Latitude: record.Latitude, Longitude: record.Longitude},
		)
	}
	return pubs, nil
}
