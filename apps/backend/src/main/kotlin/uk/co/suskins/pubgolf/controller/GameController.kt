package uk.co.suskins.pubgolf.controller

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
class GameController {

    @PostMapping("/api/v1/games")
    @ResponseStatus(HttpStatus.CREATED)
    fun createGame(@RequestBody gameRequest: GameRequest): Game {
        return Game("game-abc123", "ABC123", "player-xyz789", gameRequest.host)
    }

    @PostMapping("/api/v1/games/{gameCode}/join")
    fun joinGame(
        @PathVariable("gameCode") gameCode: String,
        @RequestBody gameJoinRequest: GameJoinRequest
    ): Game {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")
        return Game("game-abc123", "ABC123", "player-xyz789", gameJoinRequest.name)
    }

    @GetMapping("/api/v1/games/{gameCode}")
    fun gameState(@PathVariable("gameCode") gameCode: String): GameState {
        if (gameCode != "ABC123") throw GameNotFoundException("Game `$gameCode` could not be found.")
        return GameState(
            "game-abc123",
            gameCode,
            listOf(Player("player-xyz789", "Player", listOf(0, 0, 0, 0, 0, 0, 0, 0, 0)))
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
    }
}

class GameNotFoundException(override val message: String?) : Exception()

data class GameRequest(val host: String)
data class GameJoinRequest(val name: String)
data class ScoreRequest(val hole: Int, val score: Int)

data class Game(val gameId: String, val gameCode: String, val playerId: String, val playerName: String)
data class GameState(val gameId: String, val gameCode: String, val players: List<Player>)
data class Player(val id: String, val name: String, val scores: List<Int>)
