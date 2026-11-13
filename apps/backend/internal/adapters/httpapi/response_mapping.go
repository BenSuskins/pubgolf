package httpapi

import "github.com/BenSuskins/pubgolf/backend/internal/domain"

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
	for _, standing := range game.Standings() {
		response.Players = append(response.Players, playerStateResponse(standing))
	}
	return response
}

func playerStateResponse(standing domain.PlayerStanding) playerResponse {
	player := standing.Player
	result := playerResponse{
		ID: player.ID, Name: player.Name, CurrentHole: player.CurrentHole(),
		Rank: standing.Rank, HolesPlayed: standing.HolesPlayed,
		TotalScore: standing.TotalScore, ParRelative: standing.ParRelative,
		Scores: make([]*int, 9), Penalties: []penaltyResponse{},
	}
	for hole := 1; hole <= 9; hole++ {
		if score, exists := player.Scores[hole]; exists {
			value := score.Value
			result.Scores[hole-1] = &value
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
	definition, _ := domain.FindPenalty(penalty)
	return penaltyResponse{hole, penalty, definition.Points}
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
