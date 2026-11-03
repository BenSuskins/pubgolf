package domain

import (
	"fmt"
	"strings"
)

type PubRoute struct{ state PubRouteSnapshot }

func NewPubRoute(pubs []PubSnapshot, geometry *PubRouteGeometry) (PubRoute, error) {
	if len(pubs) != 9 {
		return PubRoute{}, Fail(Invalid, fmt.Sprintf("Exactly 9 pubs are required, but %d were provided", len(pubs)))
	}
	state := clonePubRoute(PubRouteSnapshot{Pubs: pubs, Geometry: geometry})
	for index, pub := range state.Pubs {
		if strings.TrimSpace(pub.Name) == "" {
			return PubRoute{}, Fail(Invalid, "Invalid pub name or coordinates")
		}
		if _, err := NewPubLocation(pub.Latitude, pub.Longitude); err != nil {
			return PubRoute{}, err
		}
		state.Pubs[index].Hole = index + 1
	}
	return PubRoute{state}, nil
}
func (route PubRoute) Snapshot() PubRouteSnapshot { return clonePubRoute(route.state) }
func (round Round) SetPubRoute(actor string, route PubRoute) (Round, []DomainEvent, error) {
	if err := round.requireHost(actor, "set pubs for this game"); err != nil {
		return round, nil, err
	}
	validated, err := NewPubRoute(route.state.Pubs, route.state.Geometry)
	if err != nil {
		return round, nil, err
	}
	round = round.copy()
	round.state.PubRoute = validated.Snapshot()
	return round, []DomainEvent{PubRouteChanged{round.metadata()}}, nil
}
