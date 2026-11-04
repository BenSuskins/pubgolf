package sqlite

import (
	"context"
	"embed"
	"io/fs"

	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var migrations embed.FS

func (repository *RoundRepository) migrate() error {
	files, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return err
	}
	provider, err := goose.NewProvider(goose.DialectSQLite3, repository.database.DB, files)
	if err != nil {
		return err
	}
	_, err = provider.Up(context.Background())
	return err
}
