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

    companion object {
        fun initialScore() = (1..9).associateWith { 0 }
    }
}

sealed interface PubGolfFailure {
    val message: String
    fun asErrorResponse() = ErrorResponse(message)
}

data class GameNotFoundFailure(override val message: String) : PubGolfFailure
data class PlayerAlreadyExistsFailure(override val message: String) : PubGolfFailure
data class PlayerNotFoundFailure(override val message: String) : PubGolfFailure
data class PersistenceFailure(override val message: String) : PubGolfFailure

fun Game.toJpa(): GameEntity {
    val gameEntity = GameEntity(id, code)
    players.forEach { gameEntity.addPlayer(PlayerEntity(it.id, it.name, gameEntity, it.scores.toMutableMap())) }
    return gameEntity
}
