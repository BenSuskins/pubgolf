package domain

import "time"

func (round Round) SubmitScore(
	actor string,
	hole HoleNumber,
	score Score,
	penalty string,
	at time.Time,
) (Round, []DomainEvent, error) {
	if _, err := NewHoleNumber(hole.Value()); err != nil {
		return round, nil, err
	}
	if penalty != "" && penalty != "SKIP" && penalty != "CHUNDER" {
		return round, nil, Fail(Invalid, "Malformed request body")
	}
	if err := round.RequirePlayer(actor); err != nil {
		return round, nil, err
	}
	if err := round.requireActive("Cannot submit score to completed game"); err != nil {
		return round, nil, err
	}
	score = penaltyScore(score, penalty)
	round = round.copy()
	for index := range round.state.Players {
		if round.state.Players[index].ID == actor {
			round.state.Players[index] = scoredPlayer(round.state.Players[index], hole, score, penalty, at)
		}
	}
	return round, []DomainEvent{ScoreSubmitted{round.metadata(), actor, hole, score, penalty}}, nil
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

func (round Round) UseWildcard(actor, outcome string) (Round, []DomainEvent, error) {
	if err := round.RequirePlayer(actor); err != nil {
		return round, nil, err
	}
	if err := round.requireActive("Cannot randomise on completed game"); err != nil {
		return round, nil, err
	}
	round = round.copy()
	for index, player := range round.state.Players {
		if player.ID != actor {
			continue
		}
		hole, err := firstUnplayedHole(player)
		if err != nil {
			return round, nil, err
		}
		round.state.Players[index].Wildcard = &WildcardResult{hole.Value(), outcome}
		return round, []DomainEvent{WildcardUsed{round.metadata(), actor, hole, outcome}}, nil
	}
	return round, nil, Fail(Conflict, "No more holes left")
}

func firstUnplayedHole(player PlayerSnapshot) (HoleNumber, error) {
	if player.Wildcard != nil {
		return HoleNumber{}, Fail(Conflict, "Randomise already used")
	}
	for hole := 1; hole <= 9; hole++ {
		if _, played := player.Scores[hole]; !played {
			return NewHoleNumber(hole)
		}
	}
	return HoleNumber{}, Fail(Conflict, "No more holes left")
}
