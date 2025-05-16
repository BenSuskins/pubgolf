package uk.co.suskins.pubgolf.controller

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class GameController {

    @PostMapping("/api/v1/games")
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
}

data class GameRequest(val host: String)
