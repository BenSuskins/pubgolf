package domain

import (
	"fmt"
	"maps"
	"slices"
	"strings"
	"time"
)

func NewGame(identifier, code, playerID, name string) Game {
	return Game{
		ID:           identifier,
		Code:         code,
		Status:       "ACTIVE",
		HostPlayerID: playerID,
		Players:      []Player{NewPlayer(playerID, name)},
	}
}

func NewPlayer(identifier, name string) Player {
	return Player{ID: identifier, Name: name, Scores: map[int]Score{}, Penalties: map[int]string{}}
}

func Clone(game Game) Game {
	game.Players = slices.Clone(game.Players)
	for index, player := range game.Players {
		player.Scores = maps.Clone(player.Scores)
		player.Penalties = maps.Clone(player.Penalties)
		if player.Randomise != nil {
			copy := *player.Randomise
			player.Randomise = &copy
		}
		game.Players[index] = player
	}
	game.Holes = slices.Clone(game.Holes)
	for index := range game.Holes {
		game.Holes[index].Drinks = slices.Clone(game.Holes[index].Drinks)
	}
	game.Pubs = slices.Clone(game.Pubs)
	if game.ActiveEvent != nil {
		copy := *game.ActiveEvent
		game.ActiveEvent = &copy
	}
	if game.Route != nil {
		copy := *game.Route
		copy.Coordinates = slices.Clone(copy.Coordinates)
		for index := range copy.Coordinates {
			copy.Coordinates[index] = slices.Clone(copy.Coordinates[index])
		}
		game.Route = &copy
	}
	return game
}

func RequirePlayer(game Game, actor string) error {
	if slices.ContainsFunc(game.Players, func(player Player) bool { return player.ID == actor }) {
		return nil
	}
	return Fail(Forbidden, fmt.Sprintf("Player `%s` does not belong to game `%s`.", actor, game.Code))
}

func RequireHost(game Game, actor, action string) error {
	if err := RequirePlayer(game, actor); err != nil {
		return err
	}
	if game.HostPlayerID != actor {
		return Fail(Forbidden, "Only the host can "+action)
	}
	return nil
}

func requireActive(game Game, message string) error {
	if game.Status == "COMPLETED" {
		return Fail(Conflict, message)
	}
	return nil
}

func SubmitScore(game Game, actor string, hole, score int, penalty string, at time.Time) (Game, []Event, error) {
	if err := validateScore(hole, score, penalty); err != nil {
		return game, nil, err
	}
	if err := RequirePlayer(game, actor); err != nil {
		return game, nil, err
	}
	if err := requireActive(game, "Cannot submit score to completed game"); err != nil {
		return game, nil, err
	}
	game = Clone(game)
	for index := range game.Players {
		if game.Players[index].ID == actor {
			game.Players[index] = scoredPlayer(game.Players[index], hole, score, penalty, at)
		}
	}
	return game, []Event{{Kind: ScoreSubmitted, Hole: hole}}, nil
}

func validateScore(hole, score int, penalty string) error {
	if hole < 1 || hole > 9 || score < -10 || score > 10 {
		return Fail(Invalid, "Invalid hole or score")
	}
	if penalty != "" && penalty != "SKIP" && penalty != "CHUNDER" {
		return Fail(Invalid, "Malformed request body")
	}
	return nil
}

func scoredPlayer(player Player, hole, score int, penalty string, at time.Time) Player {
	switch penalty {
	case "SKIP":
		score = 5
	case "CHUNDER":
		score = 10
	}
	player.Scores[hole] = Score{score, at}
	delete(player.Penalties, hole)
	if penalty != "" {
		player.Penalties[hole] = penalty
	}
	return player
}

func Course(game Game) []CourseHole {
	if len(game.Holes) == 0 {
		return DefaultCourse()
	}
	return game.Holes
}

func ValidateName(name, field string) error {
	if strings.TrimSpace(name) == "" {
		label := "Name"
		if field == "host" {
			label = "Host name"
		}
		return Fail(Invalid, "Validation failed: "+field+": "+label+" must not be blank")
	}
	return nil
}

func Join(game Game, name, identifier string, rejoin bool) (Game, []Event, error) {
	if err := ValidateName(name, "name"); err != nil {
		return game, nil, err
	}
	if err := requireActive(game, "This game has ended"); err != nil {
		return game, nil, err
	}
	for _, player := range game.Players {
		if strings.EqualFold(player.Name, name) {
			if rejoin {
				return game, nil, nil
			}
			return game, nil, Fail(Invalid, fmt.Sprintf("Player `%s` already exists for game `%s`.", name, game.Code))
		}
	}
	game = Clone(game)
	game.Players = append(game.Players, NewPlayer(identifier, name))
	return game, []Event{{Kind: PlayerJoined}}, nil
}

func Complete(game Game, actor string) (Game, []Event, error) {
	if err := RequireHost(game, actor, "complete this game"); err != nil {
		return game, nil, err
	}
	if err := requireActive(game, "Game is already completed"); err != nil {
		return game, nil, err
	}
	game = Clone(game)
	game.Status = "COMPLETED"
	game.ActiveEvent = nil
	return game, []Event{{Kind: GameCompleted}}, nil
}

func RandomisePlayer(game Game, actor, outcome string) (Game, []Event, error) {
	if err := RequirePlayer(game, actor); err != nil {
		return game, nil, err
	}
	if err := requireActive(game, "Cannot randomise on completed game"); err != nil {
		return game, nil, err
	}
	game = Clone(game)
	for index := range game.Players {
		player := &game.Players[index]
		if player.ID != actor {
			continue
		}
		if player.Randomise != nil {
			return game, nil, Fail(Conflict, "Randomise already used")
		}
		for hole := 1; hole <= 9; hole++ {
			if _, played := player.Scores[hole]; !played {
				player.Randomise = &Randomise{hole, outcome}
				return game, []Event{{Kind: RandomiseUsed}}, nil
			}
		}
	}
	return game, nil, Fail(Conflict, "No more holes left")
}

func ActivateEvent(game Game, actor string, event ActiveEvent) (Game, []Event, error) {
	if err := RequireHost(game, actor, "activate events"); err != nil {
		return game, nil, err
	}
	if err := requireActive(game, "Cannot activate event on completed game"); err != nil {
		return game, nil, err
	}
	if game.ActiveEvent != nil {
		return game, nil, Fail(
			Conflict,
			"An event is already active. End the current event before activating a new one.",
		)
	}
	var err error
	event, err = normaliseEvent(event)
	if err != nil {
		return game, nil, err
	}
	game = Clone(game)
	game.ActiveEvent = &event
	return game, []Event{{Kind: GameChanged}}, nil
}

func EndEvent(game Game, actor string) (Game, []Event, error) {
	if err := RequireHost(game, actor, "end events"); err != nil {
		return game, nil, err
	}
	if game.ActiveEvent == nil {
		return game, nil, nil
	}
	game = Clone(game)
	game.ActiveEvent = nil
	return game, []Event{{Kind: GameChanged}}, nil
}

func SetCourse(game Game, actor string, course []CourseHole) (Game, []Event, error) {
	normalised, err := normaliseCourse(course)
	if err != nil {
		return game, nil, err
	}
	if err = RequireHost(game, actor, "change drinks and pars"); err != nil {
		return game, nil, err
	}
	if err = requireActive(game, "Cannot change the course of a completed game"); err != nil {
		return game, nil, err
	}
	game = Clone(game)
	game.Holes = normalised
	return game, []Event{{Kind: GameChanged}}, nil
}

func SetPubs(game Game, actor string, pubs []Pub, route *Geometry) (Game, []Event, error) {
	if len(pubs) != 9 {
		return game, nil, Fail(Invalid, fmt.Sprintf("Exactly 9 pubs are required, but %d were provided", len(pubs)))
	}
	if err := RequireHost(game, actor, "set pubs for this game"); err != nil {
		return game, nil, err
	}
	for _, pub := range pubs {
		if err := validatePub(pub); err != nil {
			return game, nil, err
		}
	}
	game = Clone(game)
	game.Pubs = slices.Clone(pubs)
	for index := range game.Pubs {
		game.Pubs[index].Hole = index + 1
	}
	game.Route = route
	return Clone(game), []Event{{Kind: GameChanged}}, nil
}

func validatePub(pub Pub) error {
	if strings.TrimSpace(pub.Name) == "" || pub.Latitude < -90 || pub.Latitude > 90 || pub.Longitude < -180 ||
		pub.Longitude > 180 {
		return Fail(Invalid, "Invalid pub name or coordinates")
	}
	return nil
}

func normaliseEvent(event ActiveEvent) (ActiveEvent, error) {
	if event.ID == "custom" {
		event.Title = strings.TrimSpace(event.Title)
		event.Description = strings.TrimSpace(event.Description)
		if event.Title == "" || len([]rune(event.Title)) > 255 || len([]rune(event.Description)) > 500 {
			return event, Fail(Invalid, "Invalid custom event")
		}
		return event, nil
	}
	for _, option := range AvailableEvents() {
		if option.ID == event.ID {
			event.Title = option.Title
			event.Description = option.Description
			return event, nil
		}
	}
	return event, Fail(NotFound, fmt.Sprintf("Event '%s' not found", event.ID))
}
