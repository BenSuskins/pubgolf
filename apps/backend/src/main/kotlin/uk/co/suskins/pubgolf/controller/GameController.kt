package uk.co.suskins.pubgolf.controller

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.mapFailure
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
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
import org.springframework.http.HttpStatus.UNAUTHORIZED
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uk.co.suskins.pubgolf.models.ActiveEventResponse
import uk.co.suskins.pubgolf.models.ActiveEventStateResponse
import uk.co.suskins.pubgolf.models.CreateGameResponse
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
import uk.co.suskins.pubgolf.models.InvalidHostFailure
import uk.co.suskins.pubgolf.models.InvalidPubCountFailure
import uk.co.suskins.pubgolf.models.JoinGameResponse
import uk.co.suskins.pubgolf.models.MissingPlayerIdHeaderFailure
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PlayerNotInGameFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.PubLocationResponse
import uk.co.suskins.pubgolf.models.PubsAlreadySetFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.RandomiseResponse
import uk.co.suskins.pubgolf.models.RouteGeometryResponse
import uk.co.suskins.pubgolf.models.RouteResponse
import uk.co.suskins.pubgolf.models.ScoreRequest
import uk.co.suskins.pubgolf.models.SetActiveEventRequest
import uk.co.suskins.pubgolf.models.SetPubsRequest
import uk.co.suskins.pubgolf.models.UpdateGameStatusRequest
import uk.co.suskins.pubgolf.models.toGameStateResponse
import uk.co.suskins.pubgolf.service.GameService
import uk.co.suskins.pubgolf.service.PubRouteService

@RestController
@RequestMapping("/api/v1/games")
class GameController(
    private val gameService: GameService,
    private val pubRouteService: PubRouteService,
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

    @PostMapping("/{gameCode}/players")
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
            .map { it.toGameStateResponse() }
            .map { ResponseEntity.status(OK).body(it) }
            .mapFailure { resolveFailure(it) }
            .get()

    @PostMapping("/{gameCode}/scores")
    @SecurityRequirement(name = "PlayerIdHeader")
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
                responseCode = "401",
                description = "Unauthorized - Missing or invalid player ID header",
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
        @RequestHeader(value = "PubGolf-Player-Id", required = false) playerIdHeader: String?,
        @Valid @RequestBody scoreRequest: ScoreRequest,
    ): ResponseEntity<*> =
        parsePlayerIdHeader(playerIdHeader)
            .flatMap { playerId ->
                gameService
                    .validatePlayerInGame(gameCode, playerId)
                    .flatMap {
                        gameService.submitScore(
                            gameCode,
                            playerId,
                            scoreRequest.hole,
                            scoreRequest.score,
                            scoreRequest.penaltyType,
                        )
                    }
            }.map { ResponseEntity.status(NO_CONTENT).body(null) }
            .mapFailure {
                resolveFailure(it)
            }.get()

    @PostMapping("/{gameCode}/randomise")
    @SecurityRequirement(name = "PlayerIdHeader")
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
                responseCode = "401",
                description = "Unauthorized - Missing or invalid player ID header",
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
        @RequestHeader(value = "PubGolf-Player-Id", required = false) playerIdHeader: String?,
    ): ResponseEntity<*> =
        parsePlayerIdHeader(playerIdHeader)
            .flatMap { playerId ->
                gameService
                    .validatePlayerInGame(gameCode, playerId)
                    .flatMap { gameService.randomise(gameCode, playerId) }
            }.map {
                RandomiseResponse(
                    it.result,
                    it.hole,
                )
            }.map {
                ResponseEntity.status(OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @PatchMapping("/{gameCode}")
    @SecurityRequirement(name = "PlayerIdHeader")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Game status updated",
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
                responseCode = "401",
                description = "Unauthorized - Missing or invalid player ID header",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
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
    fun updateGameStatus(
        @PathVariable("gameCode") gameCode: GameCode,
        @RequestHeader(value = "PubGolf-Player-Id", required = false) playerIdHeader: String?,
        @Valid @RequestBody request: UpdateGameStatusRequest,
    ): ResponseEntity<*> =
        parsePlayerIdHeader(playerIdHeader)
            .flatMap { playerId ->
                gameService
                    .validatePlayerInGame(gameCode, playerId)
                    .flatMap { gameService.completeGame(gameCode, playerId) }
            }.map { it.toGameStateResponse() }
            .map { ResponseEntity.status(OK).body(it) }
            .mapFailure { resolveFailure(it) }
            .get()

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
            .map { activeEventState ->
                ActiveEventStateResponse(
                    activeEventState.activeEvent?.let {
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

    @PutMapping("/{gameCode}/active-event")
    @SecurityRequirement(name = "PlayerIdHeader")
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
                responseCode = "401",
                description = "Unauthorized - Missing or invalid player ID header",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
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
    fun setActiveEvent(
        @PathVariable("gameCode") gameCode: GameCode,
        @RequestHeader(value = "PubGolf-Player-Id", required = false) playerIdHeader: String?,
        @Valid @RequestBody request: SetActiveEventRequest,
    ): ResponseEntity<*> =
        parsePlayerIdHeader(playerIdHeader)
            .flatMap { playerId ->
                gameService
                    .validatePlayerInGame(gameCode, playerId)
                    .flatMap { gameService.activateEvent(gameCode, playerId, request.eventId) }
            }.map { it.toGameStateResponse() }
            .map { ResponseEntity.status(OK).body(it) }
            .mapFailure { resolveFailure(it) }
            .get()

    @DeleteMapping("/{gameCode}/active-event")
    @SecurityRequirement(name = "PlayerIdHeader")
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
                responseCode = "401",
                description = "Unauthorized - Missing or invalid player ID header",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class),
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
    fun deleteActiveEvent(
        @PathVariable("gameCode") gameCode: GameCode,
        @RequestHeader(value = "PubGolf-Player-Id", required = false) playerIdHeader: String?,
    ): ResponseEntity<*> =
        parsePlayerIdHeader(playerIdHeader)
            .flatMap { playerId ->
                gameService
                    .validatePlayerInGame(gameCode, playerId)
                    .flatMap { gameService.endEvent(gameCode, playerId) }
            }.map { it.toGameStateResponse() }
            .map { ResponseEntity.status(OK).body(it) }
            .mapFailure { resolveFailure(it) }
            .get()

    @PutMapping("/{gameCode}/pubs")
    @SecurityRequirement(name = "PlayerIdHeader")
    fun setPubs(
        @PathVariable("gameCode") gameCode: GameCode,
        @RequestHeader(value = "PubGolf-Player-Id", required = false) playerIdHeader: String?,
        @Valid @RequestBody request: SetPubsRequest,
    ): ResponseEntity<out Any> =
        parsePlayerIdHeader(playerIdHeader)
            .flatMap { playerId ->
                pubRouteService.setPubsForGame(gameCode, playerId, request.pubs)
            }.map {
                ResponseEntity.status(CREATED).build<Any>()
            }.mapFailure {
                resolveFailure(it)
            }.get()

    @GetMapping("/{gameCode}/route")
    fun getRoute(
        @PathVariable("gameCode") gameCode: GameCode,
    ): ResponseEntity<out Any> =
        pubRouteService
            .getRouteForGame(gameCode)
            .map { (pubs, routeGeometry) ->
                val pubLocations =
                    pubs.map { pub ->
                        PubLocationResponse(
                            hole = pub.hole.value,
                            name = pub.name,
                            latitude = pub.latitude,
                            longitude = pub.longitude,
                        )
                    }
                val routeResponse =
                    RouteResponse(
                        pubs = pubLocations,
                        route =
                            routeGeometry?.let {
                                RouteGeometryResponse(
                                    type = it.type,
                                    coordinates = it.coordinates,
                                )
                            },
                    )
                ResponseEntity.status(OK).body(routeResponse)
            }.mapFailure {
                resolveFailure(it)
            }.get()

    private fun parsePlayerIdHeader(playerIdHeader: String?): Result<PlayerId, PubGolfFailure> {
        if (playerIdHeader == null) {
            return Failure(MissingPlayerIdHeaderFailure("Missing required header: PubGolf-Player-Id"))
        }
        return try {
            Success(PlayerId(java.util.UUID.fromString(playerIdHeader)))
        } catch (e: IllegalArgumentException) {
            Failure(MissingPlayerIdHeaderFailure("Invalid player ID format in header: $playerIdHeader"))
        }
    }

    private fun resolveFailure(it: PubGolfFailure): ResponseEntity<ErrorResponse> {
        logger.error("Failure `${it.message}` occurred.")
        return when (it) {
            is GameNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is PlayerNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is EventNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is PlayerAlreadyExistsFailure -> ResponseEntity.status(BAD_REQUEST).body(it.asErrorResponse())
            is InvalidPubCountFailure -> ResponseEntity.status(BAD_REQUEST).body(it.asErrorResponse())
            is RandomiseAlreadyUsedFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is GameAlreadyCompletedFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is EventAlreadyActiveFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is PubsAlreadySetFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            is NotHostPlayerFailure -> ResponseEntity.status(FORBIDDEN).body(it.asErrorResponse())
            is InvalidHostFailure -> ResponseEntity.status(FORBIDDEN).body(it.asErrorResponse())
            is MissingPlayerIdHeaderFailure -> ResponseEntity.status(UNAUTHORIZED).body(it.asErrorResponse())
            is PlayerNotInGameFailure -> ResponseEntity.status(FORBIDDEN).body(it.asErrorResponse())
            else -> ResponseEntity.status(INTERNAL_SERVER_ERROR).body(it.asErrorResponse())
        }
    }
}
