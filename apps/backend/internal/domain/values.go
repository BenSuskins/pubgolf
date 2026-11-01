package domain

import (
	"math"
	"strings"
)

type (
	HoleNumber     struct{ value int }
	Score          struct{ value int }
	Par            struct{ value int }
	PlayerName     struct{ value string }
	DrinkTrackName struct{ value string }
	DrinkName      struct{ value string }
	PubLocation    struct{ latitude, longitude float64 }
)

func NewHoleNumber(value int) (HoleNumber, error) {
	if value < 1 || value > 9 {
		return HoleNumber{}, Fail(Invalid, "Invalid hole or score")
	}
	return HoleNumber{value}, nil
}
func (number HoleNumber) Value() int { return number.value }
func NewScore(value int) (Score, error) {
	if value < -10 || value > 10 {
		return Score{}, Fail(Invalid, "Invalid hole or score")
	}
	return Score{value}, nil
}
func (score Score) Value() int { return score.value }
func NewPar(value int) (Par, error) {
	if value < 1 || value > 10 {
		return Par{}, Fail(Invalid, "Invalid hole or par")
	}
	return Par{value}, nil
}
func (par Par) Value() int { return par.value }
func NewPlayerName(value string) (PlayerName, error) {
	if strings.TrimSpace(value) == "" {
		return PlayerName{}, Fail(Invalid, "Validation failed: name: Name must not be blank")
	}
	return PlayerName{value}, nil
}
func (name PlayerName) Value() string { return name.value }
func NewDrinkTrackName(value string) (DrinkTrackName, error) {
	value = strings.TrimSpace(value)
	if value == "" || len([]rune(value)) > 40 {
		return DrinkTrackName{}, Fail(Invalid, "Route names must be nonblank and unique, and at most 40 characters")
	}
	return DrinkTrackName{value}, nil
}
func (name DrinkTrackName) Value() string { return name.value }
func NewDrinkName(value string) (DrinkName, error) {
	value = strings.TrimSpace(value)
	if value == "" || len([]rune(value)) > 100 {
		return DrinkName{}, Fail(Invalid, "Invalid drink or route")
	}
	return DrinkName{value}, nil
}
func (name DrinkName) Value() string { return name.value }
func NewPubLocation(latitude, longitude float64) (PubLocation, error) {
	if !validCoordinate(latitude, 90) || !validCoordinate(longitude, 180) {
		return PubLocation{}, Fail(Invalid, "Invalid pub name or coordinates")
	}
	return PubLocation{latitude, longitude}, nil
}

func validCoordinate(value, limit float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0) && value >= -limit && value <= limit
}
func (location PubLocation) Latitude() float64  { return location.latitude }
func (location PubLocation) Longitude() float64 { return location.longitude }
