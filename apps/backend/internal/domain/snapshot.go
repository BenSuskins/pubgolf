package domain

import (
	"maps"
	"slices"
)

func (game Game) Snapshot() GameSnapshot { return game.state.Clone() }
func (game Game) ID() string             { return game.state.ID }
func (game Game) Code() string           { return game.state.Code }
func (game Game) Version() int64         { return game.state.Version }
func (game Game) WithVersion(version int64) (Game, error) {
	if version < 1 {
		return Game{}, Fail(Invalid, "Invalid game version")
	}
	game.state.Version = version
	return game, nil
}
func (game Game) copy() Game { return Game{state: game.state.Clone()} }
func (state GameSnapshot) Clone() GameSnapshot {
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
	if player.Randomise != nil {
		result := *player.Randomise
		player.Randomise = &result
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
