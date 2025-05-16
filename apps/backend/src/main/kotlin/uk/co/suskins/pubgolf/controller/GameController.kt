package uk.co.suskins.pubgolf.controller

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
class GameController {

    @PostMapping("/api/v1/games")
    @ResponseStatus(HttpStatus.CREATED)
    fun createGame(@RequestBody gameRequest: GameRequest): GameCreated {
        return GameCreated("game-abc123", "ABC123", "player-xyz789", "Ben")
    }

    @PostMapping("/api/v1/games/{gameCode}/join")
    fun joinGame(
        @PathVariable("gameCode") gameCode: String,
        @RequestBody gameJoinRequest: GameJoinRequest
    ): String {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")

        return """
                {
                  "gameId": "game-abc123",
                  "playerId": "player-xyz789"
                }
                """.trimMargin()
    }

    @GetMapping("/api/v1/games/{gameCode}")
    fun gameState(@PathVariable("gameCode") gameCode: String): String {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")

        return """
                {
                  "gameId": "game-abc123",
                  "gameCode": "ABC123",
                  "players": [
                    {
                      "playerId": "player-xyz789",
                      "name": "Ben",
                      "scores": [0, 2, 1, 0, 0, 0, 0, 0, 0]
                    }
                  ]
                }
                """.trimMargin()
    }
}

class GameNotFoundException(override val message: String?) : Exception()

data class GameRequest(val host: String)
data class GameCreated(val gameId: String, val gameCode: String, val playerId: String, val playerName: String)

data class GameJoinRequest(val name: String)
