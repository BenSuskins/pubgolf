package sqlite

import (
	"context"
	"strings"
	"time"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"github.com/jmoiron/sqlx"
)

func saveGame(ctx context.Context, transaction *sqlx.Tx, game domain.RoundSnapshot, expected int64) error {
	active, err := encode(storedEvent(game.ActiveGameplayEvent))
	if err != nil {
		return err
	}
	route, err := encode(storedGeometry(game.PubRoute.Geometry))
	if err != nil {
		return err
	}
	if expected == 0 {
		_, err = transaction.ExecContext(
			ctx,
			"INSERT INTO games(id,code,status,host_player_id,version,active_event,route) VALUES(?,?,?,?,1,?,?)",
			game.ID,
			game.Code,
			game.Status,
			game.HostPlayerID,
			active,
			route,
		)
		return classifyInsertError(err)
	}
	result, err := transaction.ExecContext(
		ctx,
		"UPDATE games SET status=?,host_player_id=?,version=version+1,active_event=?,route=? WHERE id=? AND code=? COLLATE NOCASE AND version=?",
		game.Status,
		game.HostPlayerID,
		active,
		route,
		game.ID,
		game.Code,
		expected,
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected != 1 {
		return domain.Fail(domain.StaleVersion, "Game was modified concurrently.")
	}
	return nil
}

func classifyInsertError(err error) error {
	if err != nil && strings.Contains(err.Error(), "games.code") {
		return domain.Fail(domain.DuplicateCode, "Duplicate game code")
	}
	return err
}

func replaceChildren(ctx context.Context, transaction *sqlx.Tx, game domain.RoundSnapshot) error {
	for _, table := range []string{"players", "holes", "pubs"} {
		if _, err := transaction.ExecContext(ctx, "DELETE FROM "+table+" WHERE game_id=?", game.ID); err != nil {
			return err
		}
	}
	for position, player := range game.Players {
		if err := savePlayer(ctx, transaction, game.ID, position, player); err != nil {
			return err
		}
	}
	if err := saveHoles(ctx, transaction, game); err != nil {
		return err
	}
	return savePubs(ctx, transaction, game)
}

func savePlayer(
	ctx context.Context,
	transaction *sqlx.Tx,
	gameID string,
	position int,
	player domain.PlayerSnapshot,
) error {
	randomise, err := encode(storedRandomise(player.Wildcard))
	if err != nil {
		return err
	}
	if _, err = transaction.ExecContext(
		ctx,
		"INSERT INTO players(id,game_id,position,name,randomise) VALUES(?,?,?,?,?)",
		player.ID,
		gameID,
		position,
		player.Name,
		randomise,
	); err != nil {
		return err
	}
	for hole, score := range player.Scores {
		_, err = transaction.ExecContext(
			ctx,
			"INSERT INTO scores(player_id,hole,score,modified,penalty) VALUES(?,?,?,?,?)",
			player.ID,
			hole,
			score.Value,
			score.At.Format(time.RFC3339Nano),
			player.Penalties[hole],
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func saveHoles(ctx context.Context, transaction *sqlx.Tx, game domain.RoundSnapshot) error {
	for _, hole := range game.Holes {
		drinks, err := encode(storedDrinks(hole.Drinks))
		if err != nil {
			return err
		}
		if _, err = transaction.ExecContext(
			ctx,
			"INSERT INTO holes(game_id,hole,par,drinks) VALUES(?,?,?,?)",
			game.ID,
			hole.Hole,
			hole.Par,
			drinks,
		); err != nil {
			return err
		}
	}
	return nil
}

func savePubs(ctx context.Context, transaction *sqlx.Tx, game domain.RoundSnapshot) error {
	for _, pub := range game.PubRoute.Pubs {
		if _, err := transaction.ExecContext(
			ctx,
			"INSERT INTO pubs(game_id,hole,name,latitude,longitude) VALUES(?,?,?,?,?)",
			game.ID,
			pub.Hole,
			pub.Name,
			pub.Latitude,
			pub.Longitude,
		); err != nil {
			return err
		}
	}
	return nil
}
