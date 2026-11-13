package httpapi

import "time"

type courseHole struct {
	Hole   int    `json:"hole"   required:"true" minimum:"1" maximum:"9"`
	Par    int    `json:"par"    required:"true" minimum:"1" maximum:"10"`
	Drinks drinks `json:"drinks" required:"true"`
}
type randomiseResponse struct {
	Hole   int    `json:"hole"   required:"true"`
	Result string `json:"result" required:"true"`
}
type penaltyResponse struct {
	Hole   int    `json:"hole"   required:"true"`
	Type   string `json:"type"   required:"true"`
	Points int    `json:"points" required:"true"`
}
type playerResponse struct {
	ID          string             `json:"id"          required:"true"`
	Name        string             `json:"name"        required:"true"`
	Rank        int                `json:"rank"        required:"true" minimum:"1"`
	HolesPlayed int                `json:"holesPlayed" required:"true" minimum:"0" maximum:"9"`
	CurrentHole int                `json:"currentHole" required:"true" minimum:"1" maximum:"9"`
	Scores      []*int             `json:"scores"      required:"true"`
	TotalScore  int                `json:"totalScore"  required:"true"`
	ParRelative int                `json:"parRelative" required:"true"`
	Randomise   *randomiseResponse `json:"randomise"`
	Penalties   []penaltyResponse  `json:"penalties"   required:"true"`
}
type activeEventResponse struct {
	ID          string    `json:"id"          required:"true"`
	Title       string    `json:"title"       required:"true"`
	Description string    `json:"description" required:"true"`
	ActivatedAt time.Time `json:"activatedAt" required:"true"`
}
type gameResponse struct {
	GameID       string               `json:"gameId"       required:"true"`
	GameCode     string               `json:"gameCode"     required:"true"`
	Status       string               `json:"status"       required:"true" enum:"ACTIVE,COMPLETED"`
	HostPlayerID string               `json:"hostPlayerId"`
	Players      []playerResponse     `json:"players"      required:"true"`
	ActiveEvent  *activeEventResponse `json:"activeEvent"`
	Holes        []courseHole         `json:"holes"        required:"true"`
}

type pubResponse struct {
	Hole      int     `json:"hole"      required:"true"`
	Name      string  `json:"name"      required:"true"`
	Latitude  float64 `json:"latitude"  required:"true"`
	Longitude float64 `json:"longitude" required:"true"`
}

type gameIdentityResponse struct {
	GameID     string `json:"gameId"     required:"true"`
	GameCode   string `json:"gameCode"   required:"true"`
	PlayerID   string `json:"playerId"   required:"true"`
	PlayerName string `json:"playerName" required:"true"`
}

type errorResponse struct {
	Message string `json:"message" required:"true"`
}

type healthResponse struct {
	Status string `json:"status" required:"true"`
}

type infoResponse struct{}

type routesResponse struct {
	Holes []courseHole `json:"holes" required:"true"`
}

type randomiseOptionResponse struct {
	Option     string `json:"option"     required:"true"`
	OptionSize int    `json:"optionSize" required:"true"`
}

type randomiseOptionsResponse struct {
	Options []randomiseOptionResponse `json:"options" required:"true"`
}

type penaltyOptionResponse struct {
	Type   string `json:"type"   required:"true"`
	Name   string `json:"name"   required:"true"`
	Points int    `json:"points" required:"true"`
}

type penaltyOptionsResponse struct {
	Penalties []penaltyOptionResponse `json:"penalties" required:"true"`
}

type eventOptionResponse struct {
	ID          string `json:"id"          required:"true"`
	Title       string `json:"title"       required:"true"`
	Description string `json:"description" required:"true"`
}

type eventsResponse struct {
	Events []eventOptionResponse `json:"events" required:"true"`
}

type activeEventStateResponse struct {
	ActiveEvent *activeEventResponse `json:"activeEvent"`
}

type geometryResponse struct {
	Type        string      `json:"type"        required:"true"`
	Coordinates [][]float64 `json:"coordinates" required:"true"`
}

type routeResponse struct {
	Pubs  []pubResponse     `json:"pubs"  required:"true"`
	Route *geometryResponse `json:"route"`
}

type placeResponse struct {
	Name      string  `json:"name"      required:"true"`
	Latitude  float64 `json:"latitude"  required:"true"`
	Longitude float64 `json:"longitude" required:"true"`
}
