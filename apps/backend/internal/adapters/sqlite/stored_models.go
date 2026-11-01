package sqlite

import "time"

type storedGameplayEvent struct {
	ID          string    `json:"ID"`
	Title       string    `json:"Title"`
	Description string    `json:"Description"`
	ActivatedAt time.Time `json:"ActivatedAt"`
}
type storedPubRouteGeometry struct {
	Type        string      `json:"Type"`
	Coordinates [][]float64 `json:"Coordinates"`
}
type storedRandomiseResult struct {
	Hole   int    `json:"Hole"`
	Result string `json:"Result"`
}
type storedDrinkChoice struct {
	Route string `json:"Route"`
	Name  string `json:"Name"`
}
