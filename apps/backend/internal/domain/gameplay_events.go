package domain

import (
	"fmt"
	"strings"
	"time"
)

func (game Game) ActivateGameplayEvent(actor, identifier string, at time.Time) (Game, []DomainEvent, error) {
	return game.activateGameplayEvent(actor, ActiveGameplayEvent{ID: identifier, ActivatedAt: at})
}

func (game Game) ActivateCustomGameplayEvent(
	actor, title, description string,
	at time.Time,
) (Game, []DomainEvent, error) {
	return game.activateGameplayEvent(
		actor,
		ActiveGameplayEvent{ID: "custom", Title: title, Description: description, ActivatedAt: at},
	)
}

func (game Game) activateGameplayEvent(actor string, event ActiveGameplayEvent) (Game, []DomainEvent, error) {
	if err := game.requireHost(actor, "activate events"); err != nil {
		return game, nil, err
	}
	if err := game.requireActive("Cannot activate event on completed game"); err != nil {
		return game, nil, err
	}
	if game.state.ActiveGameplayEvent != nil {
		return game, nil, Fail(
			Conflict,
			"An event is already active. End the current event before activating a new one.",
		)
	}
	event, err := normaliseGameplayEvent(event)
	if err != nil {
		return game, nil, err
	}
	game = game.copy()
	game.state.ActiveGameplayEvent = &event
	return game, []DomainEvent{GameplayEventActivated{game.metadata(), event.ID}}, nil
}

func (game Game) EndGameplayEvent(actor string) (Game, []DomainEvent, error) {
	if err := game.requireHost(actor, "end events"); err != nil {
		return game, nil, err
	}
	if game.state.ActiveGameplayEvent == nil {
		return game, nil, nil
	}
	game = game.copy()
	game.state.ActiveGameplayEvent = nil
	return game, []DomainEvent{GameplayEventEnded{game.metadata()}}, nil
}

func normaliseGameplayEvent(event ActiveGameplayEvent) (ActiveGameplayEvent, error) {
	if event.ID == "custom" {
		event.Title = strings.TrimSpace(event.Title)
		event.Description = strings.TrimSpace(event.Description)
		if event.Title == "" || len([]rune(event.Title)) > 255 || len([]rune(event.Description)) > 500 {
			return event, Fail(Invalid, "Invalid custom event")
		}
		return event, nil
	}
	for _, option := range AvailableGameplayEvents() {
		if option.ID == event.ID {
			event.Title = option.Title
			event.Description = option.Description
			return event, nil
		}
	}
	return event, Fail(NotFound, fmt.Sprintf("Event '%s' not found", event.ID))
}
