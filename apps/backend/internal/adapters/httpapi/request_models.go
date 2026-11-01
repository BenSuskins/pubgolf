package httpapi

type createGameRequest struct {
	Host *string `json:"host"`
}

type joinGameRequest struct {
	Name   *string `json:"name"`
	Rejoin bool    `json:"rejoin"`
}

type submitScoreRequest struct {
	Hole    *int   `json:"hole"`
	Score   *int   `json:"score"`
	Penalty string `json:"penaltyType"`
}

type updateGameStatusRequest struct {
	Status string `json:"status"`
}

type activateEventRequest struct {
	EventID string `json:"eventId"`
}

type customEventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type setCourseRequest struct {
	Holes []courseHole `json:"holes"`
}

type setPubsRequest struct {
	Pubs []pubRequest `json:"pubs"`
}

type pubRequest struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
