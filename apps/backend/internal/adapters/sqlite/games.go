package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"

	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type RoundRepository struct{ database *sqlx.DB }

func Open(path string) (*RoundRepository, error) {
	address := "file:" + (&url.URL{Path: path}).EscapedPath()
	database, err := sqlx.Open(
		"sqlite",
		address+"?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)",
	)
	if err != nil {
		return nil, err
	}
	database.SetMaxOpenConns(1)
	repository := &RoundRepository{database: database}
	if err = repository.migrate(); err != nil {
		database.Close()
		return nil, err
	}
	return repository, nil
}

func (repository *RoundRepository) Close() error { return repository.database.Close() }

func (repository *RoundRepository) FindByCode(ctx context.Context, code string) (domain.Round, error) {
	transaction, err := repository.database.BeginTxx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return domain.Round{}, err
	}
	defer transaction.Rollback()
	game, err := loadGame(ctx, transaction, code)
	if err != nil {
		return domain.Round{}, err
	}
	if err = transaction.Commit(); err != nil {
		return domain.Round{}, err
	}
	return game, nil
}

func (repository *RoundRepository) Save(ctx context.Context, game domain.Round, expected int64) (domain.Round, error) {
	transaction, err := repository.database.BeginTxx(ctx, nil)
	if err != nil {
		return domain.Round{}, err
	}
	defer transaction.Rollback()
	if err = saveGame(ctx, transaction, game.Snapshot(), expected); err != nil {
		return domain.Round{}, err
	}
	if err = replaceChildren(ctx, transaction, game.Snapshot()); err != nil {
		return domain.Round{}, err
	}
	if err = transaction.Commit(); err != nil {
		return domain.Round{}, err
	}
	return game.WithVersion(expected + 1)
}

func encode(value any) (sql.NullString, error) {
	encoded, err := json.Marshal(value)
	if err != nil {
		return sql.NullString{}, err
	}
	return sql.NullString{String: string(encoded), Valid: string(encoded) != "null"}, nil
}

func decode(value sql.NullString, destination any) error {
	if !value.Valid {
		return nil
	}
	return json.Unmarshal([]byte(value.String), destination)
}

func gameNotFound(code string, err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Fail(domain.NotFound, fmt.Sprintf("Game `%s` not found.", code))
	}
	return err
}
