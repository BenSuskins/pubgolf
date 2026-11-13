package domain

import "slices"

type PlayerStanding struct {
	Player      PlayerSnapshot
	TotalScore  int
	ParRelative int
	HolesPlayed int
	Rank        int
}

func (round RoundSnapshot) Standings() []PlayerStanding {
	course := round.Holes
	if len(course) == 0 {
		course = DefaultCourse().Holes()
	}
	pars := make(map[int]int, len(course))
	for _, hole := range course {
		pars[hole.Hole] = hole.Par
	}
	standings := make([]PlayerStanding, 0, len(round.Players))
	for _, player := range round.Players {
		standing := PlayerStanding{Player: player}
		for hole, score := range player.Scores {
			standing.TotalScore += score.Value
			standing.ParRelative += score.Value - pars[hole]
			standing.HolesPlayed++
		}
		standings = append(standings, standing)
	}
	slices.SortStableFunc(standings, func(left, right PlayerStanding) int {
		if left.ParRelative != right.ParRelative {
			return left.ParRelative - right.ParRelative
		}
		return right.HolesPlayed - left.HolesPlayed
	})
	for index := range standings {
		standings[index].Rank = index + 1
		if index > 0 && standings[index].ParRelative == standings[index-1].ParRelative {
			standings[index].Rank = standings[index-1].Rank
		}
	}
	return standings
}
