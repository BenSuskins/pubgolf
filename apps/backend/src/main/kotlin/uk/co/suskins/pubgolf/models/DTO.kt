package uk.co.suskins.pubgolf.models

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class GameRequest(
    @field:NotBlank(message = "Host name must not be blank")
    val host: PlayerName
)

data class GameJoinRequest(
    @field:NotBlank(message = "Name must not be blank")
    val name: PlayerName
)

data class ScoreRequest(
    @field:Max(value = 9)
    @field:Min(value = 1)
    val hole: Hole,
    @field:Max(value = 10)
    @field:Min(value = -10)
    val score: Score
)

data class CreateGameResponse(val gameId: String, val gameCode: String, val playerId: String, val playerName: String)
data class JoinGameResponse(val gameId: String, val gameCode: String, val playerId: String, val playerName: String)
data class GameStateResponse(val gameId: String, val gameCode: String, val players: List<PlayerResponse>)
data class PlayerResponse(val id: String, val name: String, val scores: List<Int>, val totalScore: Int)
data class ErrorResponse(val message: String)
