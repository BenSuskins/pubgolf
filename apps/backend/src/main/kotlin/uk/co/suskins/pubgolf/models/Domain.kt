package uk.co.suskins.pubgolf.models

import java.util.*

data class Game(
    val id: UUID,
    val code: String,
    val players: List<Player>
)

data class Player(
    val id: UUID,
    val name: String,
    val scores: Map<Int, Int> = initialScore()
) {
    fun matches(playerId: UUID) = id == playerId
    fun updateScore(
        hole: Int,
        score: Int
    ) = copy(scores = scores + (hole to score))
}

fun initialScore() = (1..9).associateWith { 0 }

sealed interface PubGolfFailure
data class GameNotFoundFailure(val message: String) : PubGolfFailure
data class PlayerAlreadyExistsFailure(val message: String) : PubGolfFailure
data class PlayerNotFoundFailure(val message: String) : PubGolfFailure
data class PersistenceFailure(val message: String) : PubGolfFailure


fun Game.toJpa(): GameEntity = GameEntity(
    id = id,
    code = code,
    players = players.map {
        PlayerEntity(id = it.id, name = it.name, scores = it.scores.toMutableMap())
    }.toMutableList()
)
