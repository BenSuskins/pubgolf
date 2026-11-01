package sqlite

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	_ "modernc.org/sqlite"
	"net/url"
	"strings"
	"time"
)

//go:embed migrations/*.sql
var migrations embed.FS

type Games struct{ database *sql.DB }

func Open(path string) (*Games, error) {
	database, err := sql.Open("sqlite", "file:"+(&url.URL{Path: path}).EscapedPath()+"?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, err
	}
	database.SetMaxOpenConns(1)
	repository := &Games{database: database}
	if err = repository.migrate(); err != nil {
		database.Close()
		return nil, err
	}
	return repository, nil
}
func (repository *Games) Close() error { return repository.database.Close() }
func (repository *Games) migrate() error {
	ctx := context.Background()
	transaction, err := repository.database.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer transaction.Rollback()
	if _, err = transaction.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)"); err != nil {
		return err
	}
	entries, err := migrations.ReadDir("migrations")
	if err != nil {
		return err
	}
	for _, entry := range entries {
		var count int
		if err = transaction.QueryRowContext(ctx, "SELECT count(*) FROM schema_migrations WHERE name=?", entry.Name()).Scan(&count); err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		contents, err := migrations.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return err
		}
		if _, err = transaction.ExecContext(ctx, string(contents)); err != nil {
			return err
		}
		if _, err = transaction.ExecContext(ctx, "INSERT INTO schema_migrations(name) VALUES(?)", entry.Name()); err != nil {
			return err
		}
	}
	return transaction.Commit()
}
func encode(value any) (any, error) {
	if value == nil {
		return nil, nil
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	if string(encoded) == "null" {
		return nil, nil
	}
	return string(encoded), nil
}
func decode(value sql.NullString, destination any) error {
	if !value.Valid {
		return nil
	}
	return json.Unmarshal([]byte(value.String), destination)
}
func (repository *Games) Save(ctx context.Context, game domain.Game, expected int64) (domain.Game, error) {
	transaction, err := repository.database.BeginTx(ctx, nil)
	if err != nil {
		return domain.Game{}, err
	}
	defer transaction.Rollback()
	active, err := encode(game.ActiveEvent)
	if err != nil {
		return domain.Game{}, err
	}
	route, err := encode(game.Route)
	if err != nil {
		return domain.Game{}, err
	}
	if expected == 0 {
		_, err = transaction.ExecContext(ctx, "INSERT INTO games(id,code,status,host_player_id,version,active_event,route) VALUES(?,?,?,?,1,?,?)", game.ID, game.Code, game.Status, game.HostPlayerID, active, route)
		if err != nil {
			if strings.Contains(err.Error(), "games.code") {
				return domain.Game{}, domain.Fail(domain.DuplicateCode, "Duplicate game code")
			}
			return domain.Game{}, err
		}
	} else {
		result, err := transaction.ExecContext(ctx, "UPDATE games SET status=?,host_player_id=?,version=version+1,active_event=?,route=? WHERE id=? AND code=? COLLATE NOCASE AND version=?", game.Status, game.HostPlayerID, active, route, game.ID, game.Code, expected)
		if err != nil {
			return domain.Game{}, err
		}
		affected, err := result.RowsAffected()
		if err != nil {
			return domain.Game{}, err
		}
		if affected != 1 {
			return domain.Game{}, domain.Fail(domain.StaleVersion, "Game was modified concurrently.")
		}
	}
	for _, table := range []string{"players", "holes", "pubs"} {
		if _, err = transaction.ExecContext(ctx, "DELETE FROM "+table+" WHERE game_id=?", game.ID); err != nil {
			return domain.Game{}, err
		}
	}
	for index, player := range game.Players {
		randomise, err := encode(player.Randomise)
		if err != nil {
			return domain.Game{}, err
		}
		if _, err = transaction.ExecContext(ctx, "INSERT INTO players(id,game_id,position,name,randomise) VALUES(?,?,?,?,?)", player.ID, game.ID, index, player.Name, randomise); err != nil {
			return domain.Game{}, err
		}
		for hole, score := range player.Scores {
			if _, err = transaction.ExecContext(ctx, "INSERT INTO scores(player_id,hole,score,modified,penalty) VALUES(?,?,?,?,?)", player.ID, hole, score.Value, score.At.Format(time.RFC3339Nano), player.Penalties[hole]); err != nil {
				return domain.Game{}, err
			}
		}
	}
	for _, hole := range game.Holes {
		drinks, err := encode(hole.Drinks)
		if err != nil {
			return domain.Game{}, err
		}
		if _, err = transaction.ExecContext(ctx, "INSERT INTO holes(game_id,hole,par,drinks) VALUES(?,?,?,?)", game.ID, hole.Hole, hole.Par, drinks); err != nil {
			return domain.Game{}, err
		}
	}
	for _, pub := range game.Pubs {
		if _, err = transaction.ExecContext(ctx, "INSERT INTO pubs(game_id,hole,name,latitude,longitude) VALUES(?,?,?,?,?)", game.ID, pub.Hole, pub.Name, pub.Latitude, pub.Longitude); err != nil {
			return domain.Game{}, err
		}
	}
	if err = transaction.Commit(); err != nil {
		return domain.Game{}, err
	}
	game = domain.Clone(game)
	game.Version = expected + 1
	return game, nil
}
func (repository *Games) Get(ctx context.Context, code string) (domain.Game, error) {
	transaction, err := repository.database.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return domain.Game{}, err
	}
	defer transaction.Rollback()
	var game domain.Game
	var active, route sql.NullString
	err = transaction.QueryRowContext(ctx, "SELECT id,code,status,host_player_id,version,active_event,route FROM games WHERE code=? COLLATE NOCASE", code).Scan(&game.ID, &game.Code, &game.Status, &game.HostPlayerID, &game.Version, &active, &route)
	if errors.Is(err, sql.ErrNoRows) {
		return game, domain.Fail(domain.NotFound, fmt.Sprintf("Game `%s` not found.", code))
	}
	if err != nil {
		return game, err
	}
	if err = decode(active, &game.ActiveEvent); err != nil {
		return game, err
	}
	if err = decode(route, &game.Route); err != nil {
		return game, err
	}
	rows, err := transaction.QueryContext(ctx, "SELECT id,name,randomise FROM players WHERE game_id=? ORDER BY position", game.ID)
	if err != nil {
		return game, err
	}
	for rows.Next() {
		var player domain.Player
		var randomise sql.NullString
		if err = rows.Scan(&player.ID, &player.Name, &randomise); err != nil {
			rows.Close()
			return game, err
		}
		player.Scores = map[int]domain.Score{}
		player.Penalties = map[int]string{}
		if err = decode(randomise, &player.Randomise); err != nil {
			rows.Close()
			return game, err
		}
		game.Players = append(game.Players, player)
	}
	if err = rows.Err(); err != nil {
		rows.Close()
		return game, err
	}
	rows.Close()
	for index := range game.Players {
		player := &game.Players[index]
		rows, err = transaction.QueryContext(ctx, "SELECT hole,score,modified,penalty FROM scores WHERE player_id=? ORDER BY hole", player.ID)
		if err != nil {
			return game, err
		}
		for rows.Next() {
			var hole, value int
			var at, penalty string
			if err = rows.Scan(&hole, &value, &at, &penalty); err != nil {
				rows.Close()
				return game, err
			}
			instant, err := time.Parse(time.RFC3339Nano, at)
			if err != nil {
				rows.Close()
				return game, err
			}
			player.Scores[hole] = domain.Score{Value: value, At: instant}
			if penalty != "" {
				player.Penalties[hole] = penalty
			}
		}
		if err = rows.Err(); err != nil {
			rows.Close()
			return game, err
		}
		rows.Close()
	}
	rows, err = transaction.QueryContext(ctx, "SELECT hole,par,drinks FROM holes WHERE game_id=? ORDER BY hole", game.ID)
	if err != nil {
		return game, err
	}
	for rows.Next() {
		var hole domain.CourseHole
		var drinks string
		if err = rows.Scan(&hole.Hole, &hole.Par, &drinks); err != nil {
			rows.Close()
			return game, err
		}
		if err = json.Unmarshal([]byte(drinks), &hole.Drinks); err != nil {
			rows.Close()
			return game, err
		}
		game.Holes = append(game.Holes, hole)
	}
	if err = rows.Err(); err != nil {
		rows.Close()
		return game, err
	}
	rows.Close()
	rows, err = transaction.QueryContext(ctx, "SELECT hole,name,latitude,longitude FROM pubs WHERE game_id=? ORDER BY hole", game.ID)
	if err != nil {
		return game, err
	}
	for rows.Next() {
		var pub domain.Pub
		if err = rows.Scan(&pub.Hole, &pub.Name, &pub.Latitude, &pub.Longitude); err != nil {
			rows.Close()
			return game, err
		}
		game.Pubs = append(game.Pubs, pub)
	}
	if err = rows.Err(); err != nil {
		rows.Close()
		return game, err
	}
	rows.Close()
	if err = transaction.Commit(); err != nil {
		return game, err
	}
	return game, nil
}
