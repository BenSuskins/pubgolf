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
import uk.co.suskins.pubgolf.models.CreateGameResponse
import uk.co.suskins.pubgolf.models.ErrorResponse
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameJoinRequest
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.GameRequest
import uk.co.suskins.pubgolf.models.GameStateResponse
import uk.co.suskins.pubgolf.models.JoinGameResponse
import uk.co.suskins.pubgolf.models.OutcomeResponse
import uk.co.suskins.pubgolf.models.Outcomes
import uk.co.suskins.pubgolf.models.OutcomesResponse
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PlayerResponse
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.RandomiseOutcomeResponse
import uk.co.suskins.pubgolf.models.RandomiseResponse
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
                    it.players
                        .map {
                            PlayerResponse(
                                it.id,
                                it.name,
                                it.scores.map { it.value.score },
                                it.scores.map { it.value.score.value }.sum(),
                                it.randomise?.let {
                                    RandomiseOutcomeResponse(it.hole, it.result.label)
                                },
                            )
                        }.sortedBy { it.totalScore },
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
            .submitScore(gameCode, playerId, scoreRequest.hole, scoreRequest.score)
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

    private fun resolveFailure(it: PubGolfFailure): ResponseEntity<ErrorResponse> {
        logger.error("Failure `${it.message}` occurred.")
        return when (it) {
            is GameNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is PlayerNotFoundFailure -> ResponseEntity.status(NOT_FOUND).body(it.asErrorResponse())
            is PlayerAlreadyExistsFailure -> ResponseEntity.status(BAD_REQUEST).body(it.asErrorResponse())
            is RandomiseAlreadyUsedFailure -> ResponseEntity.status(CONFLICT).body(it.asErrorResponse())
            else -> ResponseEntity.status(INTERNAL_SERVER_ERROR).body(it.asErrorResponse())
        }
    }
}
