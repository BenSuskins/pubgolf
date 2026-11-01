package domain

import "time"

func (game Game) SubmitScore(
	actor string,
	hole HoleNumber,
	score Score,
	penalty string,
	at time.Time,
) (Game, []DomainEvent, error) {
	if _, err := NewHoleNumber(hole.Value()); err != nil {
		return game, nil, err
	}
	if penalty != "" && penalty != "SKIP" && penalty != "CHUNDER" {
		return game, nil, Fail(Invalid, "Malformed request body")
	}
	if err := game.RequirePlayer(actor); err != nil {
		return game, nil, err
	}
	if err := game.requireActive("Cannot submit score to completed game"); err != nil {
		return game, nil, err
	}
	score = penaltyScore(score, penalty)
	game = game.copy()
	for index := range game.state.Players {
		if game.state.Players[index].ID == actor {
			game.state.Players[index] = scoredPlayer(game.state.Players[index], hole, score, penalty, at)
		}
	}
	return game, []DomainEvent{ScoreSubmitted{game.metadata(), actor, hole, score, penalty}}, nil
}

func penaltyScore(score Score, penalty string) Score {
	switch penalty {
	case "SKIP":
		return Score{5}
	case "CHUNDER":
		return Score{10}
	default:
		return score
	}
}

func scoredPlayer(player PlayerSnapshot, hole HoleNumber, score Score, penalty string, at time.Time) PlayerSnapshot {
	player.Scores[hole.Value()] = RecordedScore{score.Value(), at}
	delete(player.Penalties, hole.Value())
	if penalty != "" {
		player.Penalties[hole.Value()] = penalty
	}
	return player
}

func (game Game) Randomise(actor, outcome string) (Game, []DomainEvent, error) {
	if err := game.RequirePlayer(actor); err != nil {
		return game, nil, err
	}
	if err := game.requireActive("Cannot randomise on completed game"); err != nil {
		return game, nil, err
	}
	game = game.copy()
	for index, player := range game.state.Players {
		if player.ID != actor {
			continue
		}
		hole, err := firstUnplayedHole(player)
		if err != nil {
			return game, nil, err
		}
		game.state.Players[index].Randomise = &RandomiseResult{hole.Value(), outcome}
		return game, []DomainEvent{RandomiseUsed{game.metadata(), actor, hole, outcome}}, nil
	}
	return game, nil, Fail(Conflict, "No more holes left")
}

func firstUnplayedHole(player PlayerSnapshot) (HoleNumber, error) {
	if player.Randomise != nil {
		return HoleNumber{}, Fail(Conflict, "Randomise already used")
	}
	for hole := 1; hole <= 9; hole++ {
		if _, played := player.Scores[hole]; !played {
			return NewHoleNumber(hole)
		}
	}
	return HoleNumber{}, Fail(Conflict, "No more holes left")
}
