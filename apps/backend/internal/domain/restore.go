package domain

func RestoreRound(snapshot RoundSnapshot) (Round, error) {
	snapshot = snapshot.Clone()
	if snapshot.Status != "ACTIVE" && snapshot.Status != "COMPLETED" {
		return Round{}, Fail(Invalid, "Invalid game status")
	}
	if snapshot.Version < 0 {
		return Round{}, Fail(Invalid, "Invalid game version")
	}
	if err := restorePlayers(&snapshot); err != nil {
		return Round{}, err
	}
	if err := restoreCourse(&snapshot); err != nil {
		return Round{}, err
	}
	if err := restorePubRoute(&snapshot); err != nil {
		return Round{}, err
	}
	if snapshot.ActiveGameplayEvent != nil {
		event, err := normaliseGameplayEvent(*snapshot.ActiveGameplayEvent)
		if err != nil {
			return Round{}, err
		}
		snapshot.ActiveGameplayEvent = &event
	}
	return Round{snapshot}, nil
}

func restorePlayers(snapshot *RoundSnapshot) error {
	identifiers := map[string]bool{}
	for index, player := range snapshot.Players {
		if identifiers[player.ID] {
			return Fail(Invalid, "Duplicate player identity")
		}
		identifiers[player.ID] = true
		if _, err := NewPlayerName(player.Name); err != nil {
			return err
		}
		if err := validateRecordedScores(player); err != nil {
			return err
		}
		if player.Scores == nil {
			player.Scores = map[int]RecordedScore{}
		}
		if player.Penalties == nil {
			player.Penalties = map[int]string{}
		}
		snapshot.Players[index] = player
	}
	if !identifiers[snapshot.HostPlayerID] {
		return Fail(Invalid, "Host must belong to the game")
	}
	return nil
}

func validateRecordedScores(player PlayerSnapshot) error {
	for hole, score := range player.Scores {
		if _, err := NewHoleNumber(hole); err != nil {
			return err
		}
		if _, err := NewScore(score.Value); err != nil {
			return err
		}
	}
	for hole, penalty := range player.Penalties {
		if _, exists := player.Scores[hole]; !exists {
			return Fail(Invalid, "Penalty requires a score")
		}
		if penalty != "SKIP" && penalty != "CHUNDER" {
			return Fail(Invalid, "Invalid penalty")
		}
	}
	if player.Wildcard != nil {
		_, err := NewHoleNumber(player.Wildcard.Hole)
		return err
	}
	return nil
}

func restoreCourse(snapshot *RoundSnapshot) error {
	if len(snapshot.Holes) == 0 {
		return nil
	}
	course, err := NewCourse(snapshot.Holes)
	if err != nil {
		return err
	}
	snapshot.Holes = course.Holes()
	return nil
}

func restorePubRoute(snapshot *RoundSnapshot) error {
	if len(snapshot.PubRoute.Pubs) == 0 {
		if snapshot.PubRoute.Geometry != nil {
			return Fail(Invalid, "Route geometry requires pubs")
		}
		return nil
	}
	route, err := NewPubRoute(snapshot.PubRoute.Pubs, snapshot.PubRoute.Geometry)
	if err != nil {
		return err
	}
	snapshot.PubRoute = route.Snapshot()
	return nil
}
