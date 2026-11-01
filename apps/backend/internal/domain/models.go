package domain

import "time"

type Game struct {
	ID, Code, Status, HostPlayerID string
	Version                        int64
	Players                        []Player
	ActiveEvent                    *ActiveEvent
	Holes                          []CourseHole
	Pubs                           []Pub
	Route                          *Geometry
}
type Player struct {
	ID, Name  string
	Scores    map[int]Score
	Penalties map[int]string
	Randomise *Randomise
}
type Score struct {
	Value int
	At    time.Time
}
type Randomise struct {
	Hole   int
	Result string
}
type ActiveEvent struct {
	ID, Title, Description string
	ActivatedAt            time.Time
}
type CourseHole struct {
	Hole, Par int
	Drinks    []Drink
}
type (
	Drink struct{ Route, Name string }
	Pub   struct {
		Hole                int
		Name                string
		Latitude, Longitude float64
	}
)

type Geometry struct {
	Type        string
	Coordinates [][]float64
}
type Place struct {
	Name                string
	Latitude, Longitude float64
}
type EventKind string

const (
	GameCreated    EventKind = "game-created"
	PlayerJoined   EventKind = "player-joined"
	ScoreSubmitted EventKind = "score-submitted"
	RandomiseUsed  EventKind = "randomise-used"
	GameCompleted  EventKind = "game-completed"
	GameChanged    EventKind = "game-changed"
)

type Event struct {
	Kind EventKind
	Hole int
}
