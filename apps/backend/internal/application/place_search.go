package application

import (
	"context"

	"github.com/BenSuskins/pubgolf/backend/internal/domain"
)

type PlaceSearch struct{ searcher PlaceSearcher }

func NewPlaceSearch(searcher PlaceSearcher) *PlaceSearch { return &PlaceSearch{searcher} }

func (search *PlaceSearch) SearchPlaces(
	ctx context.Context,
	query string,
	latitude, longitude *float64,
) ([]domain.Place, error) {
	if len([]rune(query)) < 1 || len([]rune(query)) > 200 {
		return nil, domain.Fail(domain.Invalid, "Validation failed: Query must be between 1 and 200 characters")
	}
	if search.searcher == nil {
		return nil, domain.Fail(domain.Unavailable, "Failed to search places")
	}
	return search.searcher.SearchPlaces(ctx, query, latitude, longitude)
}
