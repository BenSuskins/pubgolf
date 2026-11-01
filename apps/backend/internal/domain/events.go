package domain

type (
	DomainEvent   interface{ isDomainEvent() }
	eventMetadata struct{ GameID, GameCode string }
)

func (eventMetadata) isDomainEvent() {}

type (
	GameCreated  struct{ eventMetadata }
	PlayerJoined struct {
		eventMetadata
		PlayerID string
	}
)

type ScoreSubmitted struct {
	eventMetadata
	PlayerID string
	Hole     HoleNumber
	Score    Score
	Penalty  string
}
type RandomiseUsed struct {
	eventMetadata
	PlayerID string
	Hole     HoleNumber
	Outcome  string
}
type (
	GameCompleted          struct{ eventMetadata }
	CourseChanged          struct{ eventMetadata }
	GameplayEventActivated struct {
		eventMetadata
		GameplayEventID string
	}
)

type (
	GameplayEventEnded struct{ eventMetadata }
	PubRouteChanged    struct{ eventMetadata }
)

func (game Game) metadata() eventMetadata { return eventMetadata{game.state.ID, game.state.Code} }
