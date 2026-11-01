package httpapi

import "time"

type courseHole struct {
	Hole   int    `json:"hole"`
	Par    int    `json:"par"`
	Drinks drinks `json:"drinks"`
}
type randomiseResponse struct {
	Hole   int    `json:"hole"`
	Result string `json:"result"`
}
type penaltyResponse struct {
	Hole   int    `json:"hole"`
	Type   string `json:"type"`
	Points int    `json:"points"`
}
type playerResponse struct {
	ID          string             `json:"id"`
	Name        string             `json:"name"`
	Scores      []*int             `json:"scores"`
	TotalScore  int                `json:"totalScore"`
	ParRelative int                `json:"parRelative"`
	Randomise   *randomiseResponse `json:"randomise"`
	Penalties   []penaltyResponse  `json:"penalties"`
}
type activeEventResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ActivatedAt time.Time `json:"activatedAt"`
}
type gameResponse struct {
	GameID       string               `json:"gameId"`
	GameCode     string               `json:"gameCode"`
	Status       string               `json:"status"`
	HostPlayerID string               `json:"hostPlayerId"`
	Players      []playerResponse     `json:"players"`
	ActiveEvent  *activeEventResponse `json:"activeEvent"`
	Holes        []courseHole         `json:"holes"`
}

type pubResponse struct {
	Hole      int     `json:"hole"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type gameIdentityResponse struct {
	GameID     string `json:"gameId"`
	GameCode   string `json:"gameCode"`
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
}

type errorResponse struct {
	Message string `json:"message"`
}

type healthResponse struct {
	Status string `json:"status"`
}

type infoResponse struct{}

type routesResponse struct {
	Holes []courseHole `json:"holes"`
}

type randomiseOptionResponse struct {
	Option     string `json:"option"`
	OptionSize int    `json:"optionSize"`
}

type randomiseOptionsResponse struct {
	Options []randomiseOptionResponse `json:"options"`
}

type penaltyOptionResponse struct {
	Type   string `json:"type"`
	Name   string `json:"name"`
	Points int    `json:"points"`
}

type penaltyOptionsResponse struct {
	Penalties []penaltyOptionResponse `json:"penalties"`
}

type eventOptionResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type eventsResponse struct {
	Events []eventOptionResponse `json:"events"`
}

type activeEventStateResponse struct {
	ActiveEvent *activeEventResponse `json:"activeEvent"`
}

type geometryResponse struct {
	Type        string      `json:"type"`
	Coordinates [][]float64 `json:"coordinates"`
}

type routeResponse struct {
	Pubs  []pubResponse     `json:"pubs"`
	Route *geometryResponse `json:"route"`
}

type placeResponse struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
