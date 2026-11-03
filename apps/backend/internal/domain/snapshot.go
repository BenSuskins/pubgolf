package domain

import (
	"maps"
	"slices"
)

func (round Round) Snapshot() RoundSnapshot { return round.state.Clone() }
func (round Round) ID() string              { return round.state.ID }
func (round Round) Code() string            { return round.state.Code }
func (round Round) Version() int64          { return round.state.Version }
func (round Round) WithVersion(version int64) (Round, error) {
	if version < 1 {
		return Round{}, Fail(Invalid, "Invalid game version")
	}
	round.state.Version = version
	return round, nil
}
func (round Round) copy() Round { return Round{state: round.state.Clone()} }
func (state RoundSnapshot) Clone() RoundSnapshot {
	state.Players = slices.Clone(state.Players)
	for index, player := range state.Players {
		state.Players[index] = clonePlayer(player)
	}
	state.Holes = cloneHoles(state.Holes)
	state.PubRoute = clonePubRoute(state.PubRoute)
	if state.ActiveGameplayEvent != nil {
		event := *state.ActiveGameplayEvent
		state.ActiveGameplayEvent = &event
	}
	return state
}

func clonePlayer(player PlayerSnapshot) PlayerSnapshot {
	player.Scores = maps.Clone(player.Scores)
	player.Penalties = maps.Clone(player.Penalties)
	if player.Wildcard != nil {
		result := *player.Wildcard
		player.Wildcard = &result
	}
	return player
}

func cloneHoles(holes []CourseHoleSnapshot) []CourseHoleSnapshot {
	holes = slices.Clone(holes)
	for index := range holes {
		holes[index].Drinks = slices.Clone(holes[index].Drinks)
	}
	return holes
}

func clonePubRoute(route PubRouteSnapshot) PubRouteSnapshot {
	route.Pubs = slices.Clone(route.Pubs)
	if route.Geometry != nil {
		geometry := *route.Geometry
		geometry.Coordinates = slices.Clone(geometry.Coordinates)
		for index := range geometry.Coordinates {
			geometry.Coordinates[index] = slices.Clone(geometry.Coordinates[index])
		}
		route.Geometry = &geometry
	}
	return route
}
