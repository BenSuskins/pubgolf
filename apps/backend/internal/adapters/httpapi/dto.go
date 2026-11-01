package httpapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/BenSuskins/pubgolf/backend/internal/domain"
	"slices"
	"time"
)

type drinks []domain.Drink

func (values drinks) MarshalJSON() ([]byte, error) {
	var buffer bytes.Buffer
	buffer.WriteByte('{')
	for index, value := range values {
		if index > 0 {
			buffer.WriteByte(',')
		}
		key, _ := json.Marshal(value.Route)
		name, _ := json.Marshal(value.Name)
		buffer.Write(key)
		buffer.WriteByte(':')
		buffer.Write(name)
	}
	buffer.WriteByte('}')
	return buffer.Bytes(), nil
}
func (values *drinks) UnmarshalJSON(data []byte) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	token, err := decoder.Token()
	if err != nil || token != json.Delim('{') {
		return fmt.Errorf("drinks must be an object")
	}
	for decoder.More() {
		key, err := decoder.Token()
		if err != nil {
			return err
		}
		var name string
		if err = decoder.Decode(&name); err != nil {
			return err
		}
		*values = append(*values, domain.Drink{Route: key.(string), Name: name})
	}
	_, err = decoder.Token()
	return err
}

type holeResponse struct {
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
	Holes        []holeResponse       `json:"holes"`
}

func eventResponse(event *domain.ActiveEvent) *activeEventResponse {
	if event == nil {
		return nil
	}
	return &activeEventResponse{event.ID, event.Title, event.Description, event.ActivatedAt}
}
func holesResponse(course []domain.CourseHole) []holeResponse {
	result := make([]holeResponse, 0, len(course))
	for _, hole := range course {
		result = append(result, holeResponse{hole.Hole, hole.Par, drinks(hole.Drinks)})
	}
	return result
}
func stateResponse(game domain.Game) gameResponse {
	response := gameResponse{GameID: game.ID, GameCode: game.Code, Status: game.Status, HostPlayerID: game.HostPlayerID, Players: []playerResponse{}, ActiveEvent: eventResponse(game.ActiveEvent), Holes: holesResponse(domain.Course(game))}
	pars := map[int]int{}
	for _, hole := range response.Holes {
		pars[hole.Hole] = hole.Par
	}
	for _, player := range game.Players {
		result := playerResponse{ID: player.ID, Name: player.Name, Scores: make([]*int, 9), Penalties: []penaltyResponse{}}
		for hole := 1; hole <= 9; hole++ {
			if score, exists := player.Scores[hole]; exists {
				value := score.Value
				result.Scores[hole-1] = &value
				result.TotalScore += value
				result.ParRelative += value - pars[hole]
			}
			if penalty, exists := player.Penalties[hole]; exists {
				points := 5
				if penalty == "CHUNDER" {
					points = 10
				}
				result.Penalties = append(result.Penalties, penaltyResponse{hole, penalty, points})
			}
		}
		if player.Randomise != nil {
			result.Randomise = &randomiseResponse{player.Randomise.Hole, player.Randomise.Result}
		}
		response.Players = append(response.Players, result)
	}
	played := func(player playerResponse) int {
		count := 0
		for _, score := range player.Scores {
			if score != nil {
				count++
			}
		}
		return count
	}
	slices.SortStableFunc(response.Players, func(left, right playerResponse) int {
		if left.ParRelative != right.ParRelative {
			return left.ParRelative - right.ParRelative
		}
		return played(right) - played(left)
	})
	return response
}
func identityResponse(game domain.Game, player domain.Player) any {
	return struct {
		GameID     string `json:"gameId"`
		GameCode   string `json:"gameCode"`
		PlayerID   string `json:"playerId"`
		PlayerName string `json:"playerName"`
	}{game.ID, game.Code, player.ID, player.Name}
}
