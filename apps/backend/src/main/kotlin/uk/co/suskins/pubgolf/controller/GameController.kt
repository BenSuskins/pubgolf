package uk.co.suskins.pubgolf.controller

import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.mapFailure
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import uk.co.suskins.pubgolf.models.*
import uk.co.suskins.pubgolf.service.GameService

@RestController
class GameController(private val gameService: GameService) {

    @PostMapping("/api/v1/games")
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
    fun createGame(@RequestBody gameRequest: GameRequest): ResponseEntity<*> {
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

    @PostMapping("/api/v1/games/{gameCode}/join")
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
        @RequestBody gameJoinRequest: GameJoinRequest
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

    @GetMapping("/api/v1/games/{gameCode}")
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

    @PostMapping("/api/v1/games/{gameCode}/players/{playerId}/scores")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun submitScore(
        @PathVariable("gameCode") gameCode: String,
        @PathVariable("playerId") playerId: String,
        @RequestBody scoreRequest: ScoreRequest
    ) {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")
        if (playerId != "player-xyz789") throw PlayerNotFoundException("Player `$playerId` could not be found for game `$gameCode`.")
    }

    private fun resolveFailure(it: PubGolfFailure) = when (it) {
        is GameNotFoundFailure -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(it.asErrorResponse())
        else -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(it.asErrorResponse())
    }
}

class GameNotFoundException(override val message: String?) : Exception()
class PlayerNotFoundException(override val message: String?) : Exception()

