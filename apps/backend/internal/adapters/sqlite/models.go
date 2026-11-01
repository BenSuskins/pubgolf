package sqlite

import "database/sql"

type gameRecord struct {
	ID           string         `db:"id"`
	Code         string         `db:"code"`
	Status       string         `db:"status"`
	HostPlayerID string         `db:"host_player_id"`
	Version      int64          `db:"version"`
	ActiveEvent  sql.NullString `db:"active_event"`
	Route        sql.NullString `db:"route"`
}

type playerRecord struct {
	ID        string         `db:"id"`
	Name      string         `db:"name"`
	Randomise sql.NullString `db:"randomise"`
}

type scoreRecord struct {
	Hole     int    `db:"hole"`
	Value    int    `db:"score"`
	Modified string `db:"modified"`
	Penalty  string `db:"penalty"`
}

type holeRecord struct {
	Hole   int    `db:"hole"`
	Par    int    `db:"par"`
	Drinks string `db:"drinks"`
}

type pubRecord struct {
	Hole      int     `db:"hole"`
	Name      string  `db:"name"`
	Latitude  float64 `db:"latitude"`
	Longitude float64 `db:"longitude"`
}
