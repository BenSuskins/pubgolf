package domain_test

import (
	"testing"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func TestDomainValuesRejectInvalidInputs(t *testing.T) {
	cases := map[string]func() error{
		"hole zero":        func() error { _, err := domain.NewHoleNumber(0); return err },
		"hole ten":         func() error { _, err := domain.NewHoleNumber(10); return err },
		"score too low":    func() error { _, err := domain.NewScore(-11); return err },
		"score too high":   func() error { _, err := domain.NewScore(11); return err },
		"par zero":         func() error { _, err := domain.NewPar(0); return err },
		"blank player":     func() error { _, err := domain.NewPlayerName(" "); return err },
		"blank track":      func() error { _, err := domain.NewDrinkTrackName(" "); return err },
		"blank drink":      func() error { _, err := domain.NewDrinkName(" "); return err },
		"invalid latitude": func() error { _, err := domain.NewPubLocation(91, 0); return err },
	}
	for name, construct := range cases {
		t.Run(name, func(t *testing.T) {
			if err := construct(); err == nil {
				t.Fatal("invalid domain value accepted")
			}
		})
	}
}

func TestZeroScoreIsPlayedAndNamesKeepExistingNormalisation(t *testing.T) {
	score, err := domain.NewScore(0)
	if err != nil || score.Value() != 0 {
		t.Fatal(score, err)
	}
	player, err := domain.NewPlayerName(" Alice ")
	if err != nil || player.Value() != " Alice " {
		t.Fatal(player, err)
	}
	track, err := domain.NewDrinkTrackName(" Route A ")
	if err != nil || track.Value() != "Route A" {
		t.Fatal(track, err)
	}
	drink, err := domain.NewDrinkName(" Beer ")
	if err != nil || drink.Value() != "Beer" {
		t.Fatal(drink, err)
	}
}
