package uk.co.suskins.pubgolf.models

data class Game(
    val id: GameId,
    val code: GameCode,
    val players: List<Player>
)

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val scores: Map<Hole, Score> = initialScore()
) {
    fun matches(playerId: PlayerId) = id.value == playerId.value

    fun updateScore(
        hole: Hole,
        score: Score
    ) = copy(scores = scores + (hole to score))

    companion object {
        fun initialScore() = (1..9).associateWith { 0 }.mapKeys { Hole(it.key) }.mapValues { Score(it.value) }
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
    val gameEntity = GameEntity(id.value, code.value)
    players.forEach {
        gameEntity.addPlayer(
            PlayerEntity(
                it.id.value,
                it.name.value,
                gameEntity,
                it.scores.mapKeys { it.key.value }.mapValues { it.value.value }.toMutableMap()
            )
        )
    }
    return gameEntity
}
