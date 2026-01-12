package uk.co.suskins.pubgolf.controller

import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.mapFailure
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus.BAD_REQUEST
import org.springframework.http.HttpStatus.CONFLICT
import org.springframework.http.HttpStatus.CREATED
import org.springframework.http.HttpStatus.FORBIDDEN
import org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR
import org.springframework.http.HttpStatus.NOT_FOUND
import org.springframework.http.HttpStatus.NO_CONTENT
import org.springframework.http.HttpStatus.OK
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.models.ActivateEventRequest
import uk.co.suskins.pubgolf.models.ActiveEventResponse
import uk.co.suskins.pubgolf.models.ActiveEventStateResponse
import uk.co.suskins.pubgolf.models.CompleteGameRequest
import uk.co.suskins.pubgolf.models.CreateGameResponse
import uk.co.suskins.pubgolf.models.EndEventRequest
import uk.co.suskins.pubgolf.models.ErrorResponse
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.EventResponse
import uk.co.suskins.pubgolf.models.EventsResponse
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameJoinRequest
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.GameRequest
import uk.co.suskins.pubgolf.models.GameStateResponse
import uk.co.suskins.pubgolf.models.HoleResponse
import uk.co.suskins.pubgolf.models.JoinGameResponse
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.OutcomeResponse
import uk.co.suskins.pubgolf.models.Outcomes
import uk.co.suskins.pubgolf.models.OutcomesResponse
import uk.co.suskins.pubgolf.models.PenaltyOptionResponse
import uk.co.suskins.pubgolf.models.PenaltyOptionsResponse
import uk.co.suskins.pubgolf.models.PenaltyResponse
import uk.co.suskins.pubgolf.models.PenaltyType
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PlayerResponse
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.RandomiseOutcomeResponse
import uk.co.suskins.pubgolf.models.RandomiseResponse
import uk.co.suskins.pubgolf.models.Routes
import uk.co.suskins.pubgolf.models.RoutesResponse
import uk.co.suskins.pubgolf.models.ScoreRequest
import uk.co.suskins.pubgolf.service.GameService

@RestController
@RequestMapping("/api/v1/games")
class GameController(
    private val gameService: GameService,
) {
    private val logger = LoggerFactory.getLogger(GameController::class.java)

    @PostMapping
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "201",
                description = "Game created",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = CreateGameResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun createGame(
        @Valid @RequestBody gameRequest: GameRequest,
    ): ResponseEntity<*> =
        gameService
            .createGame(gameRequest.host)
            .map {
                CreateGameResponse(
                    it.id,
                    it.code,
                    it.players[0].id,
                    it.players[0].name,
                )
            }.map {
                ResponseEntity.status(CREATED).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/join")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Game joined",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = JoinGameResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun joinGame(
        @PathVariable("gameCode") gameCode: GameCode,
        @Valid @RequestBody gameJoinRequest: GameJoinRequest,
    ): ResponseEntity<*> =
        gameService
            .joinGame(gameCode, gameJoinRequest.name)
            .map {
                JoinGameResponse(
                    it.id,
                    it.code,
                    it.players[0].id,
                    it.players[0].name,
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @GetMapping("/{gameCode}")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Game state",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = GameStateResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun gameState(
        @PathVariable("gameCode") gameCode: GameCode,
    ): ResponseEntity<*> =
        gameService
            .gameState(gameCode)
            .map {
                GameStateResponse(
                    it.id,
                    it.code,
                    it.status,
                    it.hostPlayerId,
                    it.players
                        .map { player ->
                            PlayerResponse(
                                player.id,
                                player.name,
                                player.scores.map { it.value.score },
                                player.scores.map { it.value.score.value }.sum(),
                                player.randomise?.let {
                                    RandomiseOutcomeResponse(it.hole, it.result.label)
                                },
                                player.penalties.map { penalty ->
                                    PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                                },
                            )
                        }.sortedBy { it.totalScore },
                    it.activeEvent?.let { event ->
                        ActiveEventResponse(
                            event.event.id,
                            event.event.title,
                            event.event.description,
                            event.activatedAt,
                        )
                    },
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/players/{playerId}/scores")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "204",
                description = "Score submitted",
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game or Player not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun submitScore(
        @PathVariable("gameCode") gameCode: GameCode,
        @PathVariable("playerId") playerId: PlayerId,
        @Valid @RequestBody scoreRequest: ScoreRequest,
    ): ResponseEntity<*> =
        gameService
            .submitScore(gameCode, playerId, scoreRequest.hole, scoreRequest.score, scoreRequest.penaltyType)
            .map { ResponseEntity.status(NO_CONTENT).body(null) }
            .mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/players/{playerId}/randomise")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Randomise result",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = RandomiseResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "400",
                description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game or Player not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "409",
                description = "You've already used this",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun randomise(
        @PathVariable("gameCode") gameCode: GameCode,
        @PathVariable("playerId") playerId: PlayerId,
    ): ResponseEntity<*> =
        gameService
            .randomise(gameCode, playerId)
            .map {
                RandomiseResponse(
                    it.result,
                    it.hole,
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/complete")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Game completed",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = GameStateResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "403",
                description = "Not the host",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "409",
                description = "Game already completed",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun completeGame(
        @PathVariable("gameCode") gameCode: GameCode,
        @Valid @RequestBody request: CompleteGameRequest,
    ): ResponseEntity<*> =
        gameService
            .completeGame(gameCode, request.playerId)
            .map {
                GameStateResponse(
                    it.id,
                    it.code,
                    it.status,
                    it.hostPlayerId,
                    it.players
                        .map { player ->
                            PlayerResponse(
                                player.id,
                                player.name,
                                player.scores.map { it.value.score },
                                player.scores.map { it.value.score.value }.sum(),
                                player.randomise?.let {
                                    RandomiseOutcomeResponse(it.hole, it.result.label)
                                },
                                player.penalties.map { penalty ->
                                    PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                                },
                            )
                        }.sortedBy { it.totalScore },
                    it.activeEvent?.let { event ->
                        ActiveEventResponse(
                            event.event.id,
                            event.event.title,
                            event.event.description,
                            event.activatedAt,
                        )
                    },
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @GetMapping("/randomise-options")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Wheel options",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = OutcomesResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun wheelOptions(): ResponseEntity<*> =
        ResponseEntity
            .status(OK)
            .body(OutcomesResponse(Outcomes.entries.map { OutcomeResponse(it.label, it.weight) }))

    @GetMapping("/penalty-options")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Penalty options",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = PenaltyOptionsResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun penaltyOptions(): ResponseEntity<*> =
        ResponseEntity
            .status(OK)
            .body(
                PenaltyOptionsResponse(
                    PenaltyType.entries.map {
                        PenaltyOptionResponse(it.name, it.label, it.points)
                    },
                ),
            )

    @GetMapping("/routes")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Drink routes for each hole",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = RoutesResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun routes(): ResponseEntity<*> =
        ResponseEntity
            .status(OK)
            .body(
                RoutesResponse(
                    Routes.holes.map {
                        HoleResponse(it.hole, it.par, it.drinks)
                    },
                ),
            )

    @GetMapping("/{gameCode}/events")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Available events",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = EventsResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun getAvailableEvents(
        @PathVariable("gameCode") gameCode: GameCode,
    ): ResponseEntity<*> =
        gameService
            .gameState(gameCode)
            .map {
                EventsResponse(
                    gameService.getAvailableEvents().map { event ->
                        EventResponse(event.id, event.title, event.description)
                    },
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @GetMapping("/{gameCode}/events/active")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Current active event",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ActiveEventStateResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun getActiveEvent(
        @PathVariable("gameCode") gameCode: GameCode,
    ): ResponseEntity<*> =
        gameService
            .getActiveEvent(gameCode)
            .map { activeEvent ->
                ActiveEventStateResponse(
                    activeEvent?.let {
                        ActiveEventResponse(
                            it.event.id,
                            it.event.title,
                            it.event.description,
                            it.activatedAt,
                        )
                    },
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/events/{eventId}/activate")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Event activated",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = GameStateResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "403",
                description = "Not the host",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game or event not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "409",
                description = "Event already active",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun activateEvent(
        @PathVariable("gameCode") gameCode: GameCode,
        @PathVariable("eventId") eventId: String,
        @Valid @RequestBody request: ActivateEventRequest,
    ): ResponseEntity<*> =
        gameService
            .activateEvent(gameCode, request.playerId, eventId)
            .map {
                GameStateResponse(
                    it.id,
                    it.code,
                    it.status,
                    it.hostPlayerId,
                    it.players
                        .map { player ->
                            PlayerResponse(
                                player.id,
                                player.name,
                                player.scores.map { it.value.score },
                                player.scores.map { it.value.score.value }.sum(),
                                player.randomise?.let {
                                    RandomiseOutcomeResponse(it.hole, it.result.label)
                                },
                                player.penalties.map { penalty ->
                                    PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                                },
                            )
                        }.sortedBy { it.totalScore },
                    it.activeEvent?.let { event ->
                        ActiveEventResponse(
                            event.event.id,
                            event.event.title,
                            event.event.description,
                            event.activatedAt,
                        )
                    },
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/events/end")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Event ended",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = GameStateResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "403",
                description = "Not the host",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
            ApiResponse(
                responseCode = "404",
                description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
                    ),
                ],
            ),
        ],
    )
    fun endEvent(
        @PathVariable("gameCode") gameCode: GameCode,
        @Valid @RequestBody request: EndEventRequest,
    ): ResponseEntity<*> =
        gameService
            .endEvent(gameCode, request.playerId)
            .map {
                GameStateResponse(
                    it.id,
                    it.code,
                    it.status,
                    it.hostPlayerId,
                    it.players
                        .map { player ->
                            PlayerResponse(
                                player.id,
                                player.name,
                                player.scores.map { it.value.score },
                                player.scores.map { it.value.score.value }.sum(),
                                player.randomise?.let {
                                    RandomiseOutcomeResponse(it.hole, it.result.label)
                                },
                                player.penalties.map { penalty ->
                                    PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                                },
                            )
                        }.sortedBy { it.totalScore },
                    it.activeEvent?.let { event ->
                        ActiveEventResponse(
                            event.event.id,
                            event.event.title,
                            event.event.description,
                            event.activatedAt,
                        )
                    },
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    private fun resolveFailure(it: PubGolfFailure): ResponseEntity<ErrorResponse> {
        logger.error("Failure `${it.message}` occurred.")
        return when (it) {
            is GameNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is PlayerNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is EventNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is PlayerAlreadyExistsFailure -> ResponseEntity.status(BAD_REQUEST).body(it.asErrorResponse())
            is RandomiseAlreadyUsedFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is GameAlreadyCompletedFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is EventAlreadyActiveFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is NotHostPlayerFailure -> ResponseEntity.status(FORBIDDEN).body(it.asErrorResponse())
            else -> ResponseEntity.status(INTERNAL_SERVER_ERROR).body(it.asErrorResponse())
        }
    }
}
