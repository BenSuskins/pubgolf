package domain

import (
	"fmt"
	"strings"
	"time"
)

func (round Round) ActivateGameplayEvent(actor, identifier string, at time.Time) (Round, []DomainEvent, error) {
	return round.activateGameplayEvent(actor, ActiveGameplayEvent{ID: identifier, ActivatedAt: at})
}

func (round Round) ActivateCustomGameplayEvent(
	actor, title, description string,
	at time.Time,
) (Round, []DomainEvent, error) {
	return round.activateGameplayEvent(
		actor,
		ActiveGameplayEvent{ID: "custom", Title: title, Description: description, ActivatedAt: at},
	)
}

func (round Round) activateGameplayEvent(actor string, event ActiveGameplayEvent) (Round, []DomainEvent, error) {
	if err := round.requireHost(actor, "activate events"); err != nil {
		return round, nil, err
	}
	if err := round.requireActive("Cannot activate event on completed game"); err != nil {
		return round, nil, err
	}
	if round.state.ActiveGameplayEvent != nil {
		return round, nil, Fail(
			Conflict,
			"An event is already active. End the current event before activating a new one.",
		)
	}
	event, err := normaliseGameplayEvent(event)
	if err != nil {
		return round, nil, err
	}
	round = round.copy()
	round.state.ActiveGameplayEvent = &event
	return round, []DomainEvent{GameplayEventActivated{round.metadata(), event.ID}}, nil
}

func (round Round) EndGameplayEvent(actor string) (Round, []DomainEvent, error) {
	if err := round.requireHost(actor, "end events"); err != nil {
		return round, nil, err
	}
	if round.state.ActiveGameplayEvent == nil {
		return round, nil, nil
	}
	round = round.copy()
	round.state.ActiveGameplayEvent = nil
	return round, []DomainEvent{GameplayEventEnded{round.metadata()}}, nil
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
