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

data class CreateGameResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName
)

data class JoinGameResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName
)

data class GameStateResponse(val gameId: GameId, val gameCode: GameCode, val players: List<PlayerResponse>)
data class ImFeelingLuckyResponse(val result: String, val hole: Hole, val outcomes: List<String>)
data class PlayerResponse(val id: PlayerId, val name: PlayerName, val scores: List<Score>, val totalScore: Int)
data class ErrorResponse(val message: String)
