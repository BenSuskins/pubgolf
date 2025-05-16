package uk.co.suskins.pubgolf.controller

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
class GameController {

    @PostMapping("/api/v1/game")
    @ResponseStatus(HttpStatus.CREATED)
    fun createGame(@RequestBody gameRequest: GameRequest): String {
        return """
                {
                  "gameId": "game-abc123",
                  "gameCode": "ABC123",
                  "playerId": "player-xyz789",
                  "playerName": "Ben"
                }
                """.trimMargin()
    }

    @PostMapping("/api/v1/game/{gameCode}/join")
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
}

class GameNotFoundException(override val message: String?) : Exception()

data class GameRequest(val host: String)
data class GameJoinRequest(val name: String)
