package httpapi

type createGameRequest struct {
	Host *string `json:"host" required:"true" nullable:"false" minLength:"1"`
}

type joinGameRequest struct {
	Name   *string `json:"name"   required:"true" nullable:"false" minLength:"1"`
	Rejoin bool    `json:"rejoin" required:"true"`
}

type submitScoreRequest struct {
	Hole    *int   `json:"hole"        required:"true" nullable:"false" minimum:"1"   maximum:"9"`
	Score   *int   `json:"score"       required:"true" nullable:"false" minimum:"-10" maximum:"10"`
	Penalty string `json:"penaltyType"                                                             enum:"SKIP,CHUNDER"`
}

type updateGameStatusRequest struct {
	Status string `json:"status" required:"true" enum:"ACTIVE,COMPLETED"`
}

type activateEventRequest struct {
	EventID string `json:"eventId" required:"true" minLength:"1"`
}

type customEventRequest struct {
	Title       string `json:"title"       required:"true" maxLength:"255"`
	Description string `json:"description"                 maxLength:"500"`
}

type setCourseRequest struct {
	Holes []courseHole `json:"holes" required:"true" minItems:"9" maxItems:"9"`
}

type setPubsRequest struct {
	Pubs []pubRequest `json:"pubs" required:"true" minItems:"9" maxItems:"9"`
}

type pubRequest struct {
	Name      string  `json:"name"      required:"true" minLength:"1"`
	Latitude  float64 `json:"latitude"  required:"true"               minimum:"-90"  maximum:"90"`
	Longitude float64 `json:"longitude" required:"true"               minimum:"-180" maximum:"180"`
}
