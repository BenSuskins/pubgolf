package httpapi

import "net/http"

type endpoint struct {
	pattern        string
	operationID    string
	summary        string
	handler        http.HandlerFunc
	request        any
	response       any
	status         int
	playerIdentity bool
}

func (server *server) endpoints() []endpoint {
	endpoints := server.gameEndpoints()
	endpoints = append(endpoints, server.gameplayEndpoints()...)
	endpoints = append(endpoints, server.courseEndpoints()...)
	return append(endpoints, server.configurationEndpoints()...)
}

func (server *server) gameEndpoints() []endpoint {
	return []endpoint{
		{
			"POST /api/v1/games",
			"createGame",
			"Create a game",
			server.create,
			createGameRequest{},
			gameIdentityResponse{},
			201,
			false,
		},
		{
			"POST /api/v1/games/{code}/players",
			"joinGame",
			"Join or rejoin a game",
			server.join,
			joinGameRequest{},
			gameIdentityResponse{},
			200,
			false,
		},
		{"GET /api/v1/games/{code}", "gameState", "Read the game state", server.state, nil, gameResponse{}, 200, false},
		{
			"POST /api/v1/games/{code}/scores",
			"submitScore",
			"Submit a score",
			server.score,
			submitScoreRequest{},
			nil,
			204,
			true,
		},
		{
			"POST /api/v1/games/{code}/randomise",
			"randomise",
			"Randomise a player",
			server.randomise,
			nil,
			randomiseResponse{},
			200,
			true,
		},
	}
}

func (server *server) gameplayEndpoints() []endpoint {
	return []endpoint{
		{
			"PATCH /api/v1/games/{code}",
			"updateGameStatus",
			"Complete a game",
			server.complete,
			updateGameStatusRequest{},
			gameResponse{},
			200,
			true,
		},
		{
			"GET /api/v1/games/{code}/events",
			"getAvailableEvents",
			"List gameplay events",
			server.events,
			nil,
			eventsResponse{},
			200,
			false,
		},
		{
			"GET /api/v1/games/{code}/events/active",
			"getActiveEvent",
			"Read the active gameplay event",
			server.activeEvent,
			nil,
			activeEventStateResponse{},
			200,
			false,
		},
		{
			"PUT /api/v1/games/{code}/active-event",
			"setActiveEvent",
			"Activate a gameplay event",
			server.activateEvent,
			activateEventRequest{},
			gameResponse{},
			200,
			true,
		},
		{
			"PUT /api/v1/games/{code}/active-event/custom",
			"setCustomActiveEvent",
			"Activate a custom gameplay event",
			server.customEvent,
			customEventRequest{},
			gameResponse{},
			200,
			true,
		},
	}
}

func (server *server) courseEndpoints() []endpoint {
	return []endpoint{
		{
			"DELETE /api/v1/games/{code}/active-event",
			"deleteActiveEvent",
			"End the active gameplay event",
			server.endEvent,
			nil,
			gameResponse{},
			200,
			true,
		},
		{
			"PUT /api/v1/games/{code}/holes",
			"setHoles",
			"Set the course",
			server.course,
			setCourseRequest{},
			gameResponse{},
			200,
			true,
		},
		{
			"PUT /api/v1/games/{code}/pubs",
			"setPubs",
			"Set the pub route",
			server.pubs,
			setPubsRequest{},
			nil,
			201,
			true,
		},
		{
			"GET /api/v1/games/{code}/route",
			"getRoute",
			"Read the pub route",
			server.route,
			nil,
			routeResponse{},
			200,
			false,
		},
		{
			"GET /api/v1/games/{code}/stream",
			"streamGameState",
			"Stream committed game snapshots",
			server.stream,
			nil,
			nil,
			200,
			false,
		},
	}
}

func (server *server) configurationEndpoints() []endpoint {
	return []endpoint{
		{
			"GET /api/v1/config/routes",
			"routes",
			"Read the default course",
			server.configuredCourse,
			nil,
			routesResponse{},
			200,
			false,
		},
		{
			"GET /api/v1/config/randomise-options",
			"randomiseOptions",
			"List randomise outcomes",
			server.randomiseOptions,
			nil,
			randomiseOptionsResponse{},
			200,
			false,
		},
		{
			"GET /api/v1/config/penalty-options",
			"penaltyOptions",
			"List penalties",
			server.penaltyOptions,
			nil,
			penaltyOptionsResponse{},
			200,
			false,
		},
		{"GET /api/v1/places/search", "search", "Search for places", server.search, nil, []placeResponse{}, 200, false},
	}
}
