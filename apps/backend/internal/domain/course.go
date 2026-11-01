package domain

import (
	"fmt"
	"slices"
	"strings"
)

func normaliseCourse(course []CourseHoleSnapshot) ([]CourseHoleSnapshot, error) {
	if len(course) != 9 {
		return nil, Fail(Invalid, "Each hole from 1 to 9 must be set exactly once")
	}
	course = slices.Clone(course)
	slices.SortFunc(course, func(left, right CourseHoleSnapshot) int { return left.Hole - right.Hole })
	tracks, err := courseTracks(course[0].Drinks)
	if err != nil {
		return nil, err
	}
	for index, hole := range course {
		course[index], err = normaliseHole(hole, index+1, tracks)
		if err != nil {
			return nil, err
		}
	}
	return course, nil
}

func courseTracks(drinks []DrinkChoiceSnapshot) ([]string, error) {
	if len(drinks) < 1 || len(drinks) > 4 {
		return nil, Fail(Invalid, "A course needs between 1 and 4 routes")
	}
	names := map[string]bool{}
	tracks := make([]string, 0, len(drinks))
	for _, drink := range drinks {
		trackName, err := NewDrinkTrackName(drink.TrackName)
		if err != nil {
			return nil, err
		}
		track := trackName.Value()
		key := strings.ToLower(track)
		if track == "" || len([]rune(track)) > 40 || names[key] {
			return nil, Fail(Invalid, "Route names must be nonblank and unique, and at most 40 characters")
		}
		names[key] = true
		tracks = append(tracks, track)
	}
	return tracks, nil
}

func normaliseHole(hole CourseHoleSnapshot, expected int, tracks []string) (CourseHoleSnapshot, error) {
	number, err := NewHoleNumber(hole.Hole)
	if err != nil || number.Value() != expected {
		return hole, Fail(Invalid, "Invalid hole or par")
	}
	par, err := NewPar(hole.Par)
	if err != nil {
		return hole, err
	}
	hole.Hole, hole.Par = number.Value(), par.Value()
	if len(hole.Drinks) != len(tracks) {
		return hole, Fail(Invalid, fmt.Sprintf("Hole %d must have a drink for every route", hole.Hole))
	}
	drinks, err := normaliseDrinks(hole.Drinks, tracks)
	if err != nil {
		return hole, err
	}
	hole.Drinks = drinks
	return hole, nil
}

func normaliseDrinks(drinks []DrinkChoiceSnapshot, tracks []string) ([]DrinkChoiceSnapshot, error) {
	names := map[string]string{}
	for _, drink := range drinks {
		track := strings.TrimSpace(drink.TrackName)
		drinkName, err := NewDrinkName(drink.Name)
		if err != nil {
			return nil, err
		}
		name := drinkName.Value()
		if !slices.Contains(tracks, track) || name == "" || len([]rune(name)) > 100 {
			return nil, Fail(Invalid, "Invalid drink or route")
		}
		if _, exists := names[track]; exists {
			return nil, Fail(Invalid, "Duplicate route")
		}
		names[track] = name
	}
	ordered := make([]DrinkChoiceSnapshot, 0, len(tracks))
	for _, track := range tracks {
		name, exists := names[track]
		if !exists {
			return nil, Fail(Invalid, "Every hole must have the same routes")
		}
		ordered = append(ordered, DrinkChoiceSnapshot{track, name})
	}
	return ordered, nil
}

type Course struct{ holes []CourseHoleSnapshot }

func NewCourse(holes []CourseHoleSnapshot) (Course, error) {
	normalised, err := normaliseCourse(holes)
	return Course{normalised}, err
}
func (course Course) Holes() []CourseHoleSnapshot { return cloneHoles(course.holes) }
func (game Game) Course() Course {
	if len(game.state.Holes) == 0 {
		return DefaultCourse()
	}
	return Course{cloneHoles(game.state.Holes)}
}

func (game Game) SetCourse(actor string, course Course) (Game, []DomainEvent, error) {
	course, err := NewCourse(course.holes)
	if err != nil {
		return game, nil, err
	}
	if err = game.requireHost(actor, "change drinks and pars"); err != nil {
		return game, nil, err
	}
	if err = game.requireActive("Cannot change the course of a completed game"); err != nil {
		return game, nil, err
	}
	game = game.copy()
	game.state.Holes = course.Holes()
	return game, []DomainEvent{CourseChanged{game.metadata()}}, nil
}
