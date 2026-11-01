package domain

import (
	"fmt"
	"slices"
	"strings"
)

func NewGame(identifier, code, playerID string, name PlayerName) (Game, []DomainEvent, error) {
	if _, err := NewPlayerName(name.Value()); err != nil {
		return Game{}, nil, err
	}
	game := Game{
		state: GameSnapshot{
			ID:           identifier,
			Code:         code,
			Status:       "ACTIVE",
			HostPlayerID: playerID,
			Players:      []PlayerSnapshot{newPlayer(playerID, name)},
		},
	}
	return game, []DomainEvent{GameCreated{game.metadata()}}, nil
}

func newPlayer(identifier string, name PlayerName) PlayerSnapshot {
	return PlayerSnapshot{
		ID:        identifier,
		Name:      name.Value(),
		Scores:    map[int]RecordedScore{},
		Penalties: map[int]string{},
	}
}

func (game Game) RequirePlayer(actor string) error {
	if slices.ContainsFunc(game.state.Players, func(player PlayerSnapshot) bool { return player.ID == actor }) {
		return nil
	}
	return Fail(Forbidden, fmt.Sprintf("Player `%s` does not belong to game `%s`.", actor, game.state.Code))
}

func (game Game) requireHost(actor, action string) error {
	if err := game.RequirePlayer(actor); err != nil {
		return err
	}
	if game.state.HostPlayerID != actor {
		return Fail(Forbidden, "Only the host can "+action)
	}
	return nil
}

func (game Game) requireActive(message string) error {
	if game.state.Status == "COMPLETED" {
		return Fail(Conflict, message)
	}
	return nil
}

func (game Game) Join(name PlayerName, identifier string, rejoin bool) (Game, []DomainEvent, error) {
	if _, err := NewPlayerName(name.Value()); err != nil {
		return game, nil, err
	}
	if err := game.requireActive("This game has ended"); err != nil {
		return game, nil, err
	}
	for _, player := range game.state.Players {
		if strings.EqualFold(player.Name, name.Value()) {
			if rejoin {
				return game, nil, nil
			}
			return game, nil, Fail(
				Invalid,
				fmt.Sprintf("Player `%s` already exists for game `%s`.", name.Value(), game.state.Code),
			)
		}
	}
	game = game.copy()
	game.state.Players = append(game.state.Players, newPlayer(identifier, name))
	return game, []DomainEvent{PlayerJoined{game.metadata(), identifier}}, nil
}

func (game Game) Complete(actor string) (Game, []DomainEvent, error) {
	if err := game.requireHost(actor, "complete this game"); err != nil {
		return game, nil, err
	}
	if err := game.requireActive("Game is already completed"); err != nil {
		return game, nil, err
	}
	game = game.copy()
	game.state.Status = "COMPLETED"
	game.state.ActiveGameplayEvent = nil
	return game, []DomainEvent{GameCompleted{game.metadata()}}, nil
}
