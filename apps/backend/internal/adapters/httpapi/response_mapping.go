package httpapi

import (
	"slices"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func eventResponse(event *domain.ActiveGameplayEvent) *activeEventResponse {
	if event == nil {
		return nil
	}
	return &activeEventResponse{event.ID, event.Title, event.Description, event.ActivatedAt}
}

func holesResponse(course []domain.CourseHoleSnapshot) []courseHole {
	result := make([]courseHole, 0, len(course))
	for _, hole := range course {
		result = append(result, courseHole{hole.Hole, hole.Par, drinks(hole.Drinks)})
	}
	return result
}

func stateResponse(game domain.RoundSnapshot) gameResponse {
	response := gameResponse{
		GameID:       game.ID,
		GameCode:     game.Code,
		Status:       game.Status,
		HostPlayerID: game.HostPlayerID,
		Players:      []playerResponse{},
		ActiveEvent:  eventResponse(game.ActiveGameplayEvent),
		Holes:        holesResponse(snapshotCourse(game)),
	}
	pars := map[int]int{}
	for _, hole := range response.Holes {
		pars[hole.Hole] = hole.Par
	}
	for _, player := range game.Players {
		response.Players = append(response.Players, playerStateResponse(player, pars))
	}
	slices.SortStableFunc(response.Players, comparePlayers)
	return response
}

func playerStateResponse(player domain.PlayerSnapshot, pars map[int]int) playerResponse {
	result := playerResponse{ID: player.ID, Name: player.Name, Scores: make([]*int, 9), Penalties: []penaltyResponse{}}
	for hole := 1; hole <= 9; hole++ {
		if score, exists := player.Scores[hole]; exists {
			value := score.Value
			result.Scores[hole-1] = &value
			result.TotalScore += value
			result.ParRelative += value - pars[hole]
		}
		if penalty, exists := player.Penalties[hole]; exists {
			result.Penalties = append(result.Penalties, penaltyStateResponse(hole, penalty))
		}
	}
	if player.Wildcard != nil {
		result.Randomise = &randomiseResponse{player.Wildcard.Hole, player.Wildcard.Result}
	}
	return result
}

func penaltyStateResponse(hole int, penalty string) penaltyResponse {
	points := 5
	if penalty == "CHUNDER" {
		points = 10
	}
	return penaltyResponse{hole, penalty, points}
}

func comparePlayers(left, right playerResponse) int {
	if left.ParRelative != right.ParRelative {
		return left.ParRelative - right.ParRelative
	}
	return playedHoles(right) - playedHoles(left)
}

func playedHoles(player playerResponse) int {
	count := 0
	for _, score := range player.Scores {
		if score != nil {
			count++
		}
	}
	return count
}

func identityResponse(game domain.Round, player domain.PlayerSnapshot) gameIdentityResponse {
	return gameIdentityResponse{GameID: game.ID(), GameCode: game.Code(), PlayerID: player.ID, PlayerName: player.Name}
}

func snapshotCourse(game domain.RoundSnapshot) []domain.CourseHoleSnapshot {
	if len(game.Holes) == 0 {
		return domain.DefaultCourse().Holes()
	}
	return game.Holes
}
