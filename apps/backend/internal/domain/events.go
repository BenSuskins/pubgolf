package domain

type (
	DomainEvent   interface{ isDomainEvent() }
	eventMetadata struct{ RoundID, RoundCode string }
)

func (eventMetadata) isDomainEvent() {}

type (
	RoundCreated struct{ eventMetadata }
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
type WildcardUsed struct {
	eventMetadata
	PlayerID string
	Hole     HoleNumber
	Outcome  string
}
type (
	RoundCompleted         struct{ eventMetadata }
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

func (round Round) metadata() eventMetadata { return eventMetadata{round.state.ID, round.state.Code} }
