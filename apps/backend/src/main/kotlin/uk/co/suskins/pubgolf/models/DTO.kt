package uk.co.suskins.pubgolf.models

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class GameRequest(
    @field:NotBlank(message = "Host name must not be blank")
    val host: PlayerName,
)

data class GameJoinRequest(
    @field:NotBlank(message = "Name must not be blank")
    val name: PlayerName,
)

data class ScoreRequest(
    @field:Max(value = 9)
    @field:Min(value = 1)
    val hole: Hole,
    @field:Max(value = 10)
    @field:Min(value = -10)
    val score: Score,
    val penaltyType: PenaltyType? = null,
)

data class CompleteGameRequest(
    val playerId: PlayerId,
)

data class CreateGameResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName,
)

data class JoinGameResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val playerId: PlayerId,
    val playerName: PlayerName,
)

data class GameStateResponse(
    val gameId: GameId,
    val gameCode: GameCode,
    val status: GameStatus,
    val hostPlayerId: PlayerId?,
    val players: List<PlayerResponse>,
)

data class RandomiseResponse(
    val result: String,
    val hole: Hole,
)

data class OutcomesResponse(
    val options: List<OutcomeResponse>,
)

data class OutcomeResponse(
    val option: String,
    val optionSize: Int,
)

data class PenaltyOptionsResponse(
    val penalties: List<PenaltyOptionResponse>,
)

data class PenaltyOptionResponse(
    val type: String,
    val name: String,
    val points: Int,
)

data class PlayerResponse(
    val id: PlayerId,
    val name: PlayerName,
    val scores: List<Score>,
    val totalScore: Int,
    val randomise: RandomiseOutcomeResponse?,
    val penalties: List<PenaltyResponse>,
)

data class PenaltyResponse(
    val hole: Hole,
    val type: String,
    val points: Int,
)

data class RandomiseOutcomeResponse(
    val hole: Hole,
    val result: String,
)

data class ErrorResponse(
    val message: String,
)
