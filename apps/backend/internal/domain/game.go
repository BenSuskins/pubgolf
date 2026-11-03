package domain

import (
	"fmt"
	"slices"
	"strings"
)

func NewRound(identifier, code, playerID string, name PlayerName) (Round, []DomainEvent, error) {
	if _, err := NewPlayerName(name.Value()); err != nil {
		return Round{}, nil, err
	}
	game := Round{
		state: RoundSnapshot{
			ID:           identifier,
			Code:         code,
			Status:       "ACTIVE",
			HostPlayerID: playerID,
			Players:      []PlayerSnapshot{newPlayer(playerID, name)},
		},
	}
	return game, []DomainEvent{RoundCreated{game.metadata()}}, nil
}

func newPlayer(identifier string, name PlayerName) PlayerSnapshot {
	return PlayerSnapshot{
		ID:        identifier,
		Name:      name.Value(),
		Scores:    map[int]RecordedScore{},
		Penalties: map[int]string{},
	}
}

func (round Round) RequirePlayer(actor string) error {
	if slices.ContainsFunc(round.state.Players, func(player PlayerSnapshot) bool { return player.ID == actor }) {
		return nil
	}
	return Fail(Forbidden, fmt.Sprintf("Player `%s` does not belong to game `%s`.", actor, round.state.Code))
}

func (round Round) requireHost(actor, action string) error {
	if err := round.RequirePlayer(actor); err != nil {
		return err
	}
	if round.state.HostPlayerID != actor {
		return Fail(Forbidden, "Only the host can "+action)
	}
	return nil
}

func (round Round) requireActive(message string) error {
	if round.state.Status == "COMPLETED" {
		return Fail(Conflict, message)
	}
	return nil
}

func (round Round) Join(name PlayerName, identifier string, rejoin bool) (Round, []DomainEvent, error) {
	if _, err := NewPlayerName(name.Value()); err != nil {
		return round, nil, err
	}
	if err := round.requireActive("This game has ended"); err != nil {
		return round, nil, err
	}
	for _, player := range round.state.Players {
		if strings.EqualFold(player.Name, name.Value()) {
			if rejoin {
				return round, nil, nil
			}
			return round, nil, Fail(
				Invalid,
				fmt.Sprintf("Player `%s` already exists for game `%s`.", name.Value(), round.state.Code),
			)
		}
	}
	round = round.copy()
	round.state.Players = append(round.state.Players, newPlayer(identifier, name))
	return round, []DomainEvent{PlayerJoined{round.metadata(), identifier}}, nil
}

func (round Round) Complete(actor string) (Round, []DomainEvent, error) {
	if err := round.requireHost(actor, "complete this game"); err != nil {
		return round, nil, err
	}
	if err := round.requireActive("Game is already completed"); err != nil {
		return round, nil, err
	}
	round = round.copy()
	round.state.Status = "COMPLETED"
	round.state.ActiveGameplayEvent = nil
	return round, []DomainEvent{RoundCompleted{round.metadata()}}, nil
}
