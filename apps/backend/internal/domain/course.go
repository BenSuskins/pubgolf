package domain

import (
	"fmt"
	"slices"
	"strings"
)

func normaliseCourse(course []CourseHole) ([]CourseHole, error) {
	if len(course) != 9 {
		return nil, Fail(Invalid, "Each hole from 1 to 9 must be set exactly once")
	}
	course = slices.Clone(course)
	slices.SortFunc(course, func(left, right CourseHole) int { return left.Hole - right.Hole })
	routes, err := courseRoutes(course[0].Drinks)
	if err != nil {
		return nil, err
	}
	for index, hole := range course {
		course[index], err = normaliseHole(hole, index+1, routes)
		if err != nil {
			return nil, err
		}
	}
	return course, nil
}

func courseRoutes(drinks []Drink) ([]string, error) {
	if len(drinks) < 1 || len(drinks) > 4 {
		return nil, Fail(Invalid, "A course needs between 1 and 4 routes")
	}
	names := map[string]bool{}
	routes := make([]string, 0, len(drinks))
	for _, drink := range drinks {
		route := strings.TrimSpace(drink.Route)
		key := strings.ToLower(route)
		if route == "" || len([]rune(route)) > 40 || names[key] {
			return nil, Fail(Invalid, "Route names must be nonblank and unique, and at most 40 characters")
		}
		names[key] = true
		routes = append(routes, route)
	}
	return routes, nil
}

func normaliseHole(hole CourseHole, expected int, routes []string) (CourseHole, error) {
	if hole.Hole != expected || hole.Par < 1 || hole.Par > 10 {
		return hole, Fail(Invalid, "Invalid hole or par")
	}
	if len(hole.Drinks) != len(routes) {
		return hole, Fail(Invalid, fmt.Sprintf("Hole %d must have a drink for every route", hole.Hole))
	}
	drinks, err := normaliseDrinks(hole.Drinks, routes)
	if err != nil {
		return hole, err
	}
	hole.Drinks = drinks
	return hole, nil
}

func normaliseDrinks(drinks []Drink, routes []string) ([]Drink, error) {
	names := map[string]string{}
	for _, drink := range drinks {
		route := strings.TrimSpace(drink.Route)
		name := strings.TrimSpace(drink.Name)
		if !slices.Contains(routes, route) || name == "" || len([]rune(name)) > 100 {
			return nil, Fail(Invalid, "Invalid drink or route")
		}
		if _, exists := names[route]; exists {
			return nil, Fail(Invalid, "Duplicate route")
		}
		names[route] = name
	}
	ordered := make([]Drink, 0, len(routes))
	for _, route := range routes {
		name, exists := names[route]
		if !exists {
			return nil, Fail(Invalid, "Every hole must have the same routes")
		}
		ordered = append(ordered, Drink{route, name})
	}
	return ordered, nil
}
