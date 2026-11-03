package domain

import "time"

type Round struct{ state RoundSnapshot }

type RoundSnapshot struct {
	ID                  string
	Code                string
	Status              string
	HostPlayerID        string
	Version             int64
	Players             []PlayerSnapshot
	ActiveGameplayEvent *ActiveGameplayEvent
	Holes               []CourseHoleSnapshot
	PubRoute            PubRouteSnapshot
}
type PlayerSnapshot struct {
	ID        string
	Name      string
	Scores    map[int]RecordedScore
	Penalties map[int]string
	Wildcard  *WildcardResult
}
type RecordedScore struct {
	Value int
	At    time.Time
}
type WildcardResult struct {
	Hole   int
	Result string
}
type ActiveGameplayEvent struct {
	ID, Title, Description string
	ActivatedAt            time.Time
}
type CourseHoleSnapshot struct {
	Hole, Par int
	Drinks    []DrinkChoiceSnapshot
}
type (
	DrinkChoiceSnapshot struct{ TrackName, Name string }
	PubSnapshot         struct {
		Hole                int
		Name                string
		Latitude, Longitude float64
	}
)

type PubRouteGeometry struct {
	Type        string
	Coordinates [][]float64
}
type PubRouteSnapshot struct {
	Pubs     []PubSnapshot
	Geometry *PubRouteGeometry
}
type Place struct {
	Name                string
	Latitude, Longitude float64
}
