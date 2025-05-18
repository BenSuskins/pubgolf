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
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import uk.co.suskins.pubgolf.models.*
import uk.co.suskins.pubgolf.service.GameService
import java.util.*

@RestController
@RequestMapping("/api/v1/games")
class GameController(private val gameService: GameService) {
    private val logger = LoggerFactory.getLogger(GameController::class.java)

    @PostMapping
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "201", description = "Game created",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = CreateGameResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "400", description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            )
        ]
    )
    fun createGame(@Valid @RequestBody gameRequest: GameRequest): ResponseEntity<*> {
        return gameService.createGame(gameRequest.host)
            .map {
                CreateGameResponse(
                    it.id.toString(),
                    it.code,
                    it.players[0].id.toString(),
                    it.players[0].name
                )
            }.map {
                ResponseEntity.status(HttpStatus.CREATED).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()
    }

    @PostMapping("/{gameCode}/join")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200", description = "Game joined",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = JoinGameResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "400", description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "404", description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            )
        ]
    )
    fun joinGame(
        @PathVariable("gameCode") gameCode: String,
        @Valid @RequestBody gameJoinRequest: GameJoinRequest
    ): ResponseEntity<*> {
        return gameService.joinGame(gameCode, gameJoinRequest.name)
            .map {
                JoinGameResponse(
                    it.id.toString(),
                    it.code,
                    it.players[0].id.toString(),
                    it.players[0].name
                )
            }.map {
                ResponseEntity.status(HttpStatus.OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()
    }

    @GetMapping("/{gameCode}")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200", description = "Game state",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = GameStateResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "400", description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "404", description = "Game not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            )
        ]
    )
    fun gameState(@PathVariable("gameCode") gameCode: String): ResponseEntity<*> {
        return gameService.gameState(gameCode)
            .map {
                GameStateResponse(
                    it.id.toString(),
                    it.code,
                    it.players.map { PlayerResponse(it.id.toString(), it.name, it.scores.map { it.value }) }
                )
            }.map {
                ResponseEntity.status(HttpStatus.OK).body(it)
            }.mapFailure {
                resolveFailure(it)
            }.get()
    }

    @PostMapping("/{gameCode}/players/{playerId}/scores")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "204", description = "Score submitted"
            ),
            ApiResponse(
                responseCode = "400", description = "Invalid argument",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "404", description = "Game or Player not found",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            ),
            ApiResponse(
                responseCode = "500",
                content = [
                    Content(
                        mediaType = "application/json",
                        schema = Schema(implementation = ErrorResponse::class)
                    )
                ]
            )
        ]
    )
    fun submitScore(
        @PathVariable("gameCode") gameCode: String,
        @PathVariable("playerId") playerId: String,
        @Valid @RequestBody scoreRequest: ScoreRequest
    ): ResponseEntity<*> {
        return gameService.submitScore(gameCode, UUID.fromString(playerId), scoreRequest.hole, scoreRequest.score)
            .map { ResponseEntity.status(HttpStatus.NO_CONTENT).body(null) }
            .mapFailure {
                resolveFailure(it)
            }.get()
    }

    private fun resolveFailure(it: PubGolfFailure): ResponseEntity<ErrorResponse> {
        logger.error("Failure `${it.message}` occurred.")
        return when (it) {
            is GameNotFoundFailure -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(it.asErrorResponse())
            is PlayerNotFoundFailure -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(it.asErrorResponse())
            is PlayerAlreadyExistsFailure -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(it.asErrorResponse())
            else -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(it.asErrorResponse())
        }
    }
}

