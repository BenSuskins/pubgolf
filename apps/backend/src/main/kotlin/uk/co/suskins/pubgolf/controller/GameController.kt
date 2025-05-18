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
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(it.asErrorResponse())
            }.get()
    }

    @PostMapping("/api/v1/games/{gameCode}/join")
    fun joinGame(
        @PathVariable("gameCode") gameCode: String,
        @RequestBody gameJoinRequest: GameJoinRequest
    ): CreateGameResponse {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")
        return CreateGameResponse("game-abc123", "ABC123", "player-xyz789", gameJoinRequest.name)
    }

    @GetMapping("/api/v1/games/{gameCode}")
    fun gameState(@PathVariable("gameCode") gameCode: String): GameStateResponse {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")
        return GameStateResponse(
            "game-abc123",
            gameCode,
            listOf(PlayerResponse("player-xyz789", "Player", listOf(0, 0, 0, 0, 0, 0, 0, 0, 0)))
        )
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
}

class GameNotFoundException(override val message: String?) : Exception()
class PlayerNotFoundException(override val message: String?) : Exception()

