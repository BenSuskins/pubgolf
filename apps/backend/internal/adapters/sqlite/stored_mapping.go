package sqlite

import (
	"database/sql"
	"encoding/json"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

func storedEvent(event *domain.ActiveGameplayEvent) *storedGameplayEvent {
	if event == nil {
		return nil
	}
	return &storedGameplayEvent{event.ID, event.Title, event.Description, event.ActivatedAt}
}

func storedGeometry(geometry *domain.PubRouteGeometry) *storedPubRouteGeometry {
	if geometry == nil {
		return nil
	}
	return &storedPubRouteGeometry{geometry.Type, geometry.Coordinates}
}

func storedRandomise(result *domain.RandomiseResult) *storedRandomiseResult {
	if result == nil {
		return nil
	}
	return &storedRandomiseResult{result.Hole, result.Result}
}

func storedDrinks(drinks []domain.DrinkChoiceSnapshot) []storedDrinkChoice {
	if drinks == nil {
		return nil
	}
	result := make([]storedDrinkChoice, 0, len(drinks))
	for _, drink := range drinks {
		result = append(result, storedDrinkChoice{drink.TrackName, drink.Name})
	}
	return result
}

func loadStoredEvent(value sql.NullString, event **domain.ActiveGameplayEvent) error {
	var record *storedGameplayEvent
	if err := decode(value, &record); err != nil {
		return err
	}
	if record != nil {
		*event = &domain.ActiveGameplayEvent{
			ID:          record.ID,
			Title:       record.Title,
			Description: record.Description,
			ActivatedAt: record.ActivatedAt,
		}
	}
	return nil
}

func loadStoredGeometry(value sql.NullString, geometry **domain.PubRouteGeometry) error {
	var record *storedPubRouteGeometry
	if err := decode(value, &record); err != nil {
		return err
	}
	if record != nil {
		*geometry = &domain.PubRouteGeometry{Type: record.Type, Coordinates: record.Coordinates}
	}
	return nil
}

func loadStoredRandomise(value sql.NullString, result **domain.RandomiseResult) error {
	var record *storedRandomiseResult
	if err := decode(value, &record); err != nil {
		return err
	}
	if record != nil {
		*result = &domain.RandomiseResult{Hole: record.Hole, Result: record.Result}
	}
	return nil
}

func loadStoredDrinks(value string, drinks *[]domain.DrinkChoiceSnapshot) error {
	var records []storedDrinkChoice
	if err := json.Unmarshal([]byte(value), &records); err != nil {
		return err
	}
	for _, record := range records {
		*drinks = append(*drinks, domain.DrinkChoiceSnapshot{TrackName: record.Route, Name: record.Name})
	}
	return nil
}
