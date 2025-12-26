package uk.co.suskins.pubgolf.models

import java.time.Instant

data class Game(
    val id: GameId,
    val code: GameCode,
    val players: List<Player>,
)

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val scores: Map<Hole, ScoreWithTimestamp> = initialScore(),
    val lucky: Lucky? = null,
) {
    fun matches(playerId: PlayerId) = id.value == playerId.value

    fun updateScore(
        hole: Hole,
        score: Score,
    ) = copy(scores = scores + (hole to ScoreWithTimestamp(score, Instant.now())))

    fun updateLucky(
        hole: Hole,
        result: Outcomes,
    ) = copy(lucky = Lucky(hole, result))

    companion object {
        fun initialScore(): Map<Hole, ScoreWithTimestamp> {
            val now = Instant.now()
            return (1..9)
                .associateWith { 0 }
                .mapKeys { Hole(it.key) }
                .mapValues { ScoreWithTimestamp(Score(it.value), now) }
        }
    }
}

data class ScoreWithTimestamp(
    val score: Score,
    var instant: Instant,
)

data class Lucky(
    val hole: Hole,
    val result: Outcomes,
)

data class ImFeelingLucky(
    val result: String,
    val hole: Hole,
    val outcomes: List<Outcomes>,
)

enum class Outcomes(
    val label: String,
    val weight: Int,
    val description: String,
) {
    DOUBLE_DRINK("Double Drink", 4, "Do double the current hole's drink"),
    HALF_SCORE("Half Score", 2, "Score half of what you actually got"),
    DOUBLE_SCORE("Double Score", 3, "Score double what you actually got"),
    FREE_CHOICE("Free Choice", 1, "Pick an alcoholic drink of your choosing"),
    TEQUILA("Tequila", 5, "Drink a shot of tequila"),
    BEER("Beer", 5, "Drink a beer"),
    WINE("Wine", 5, "Drink a glass of wine"),
    CIDER("Cider", 5, "Drink a cider"),
    COCKTAIL("Cocktail", 5, "Drink a cocktail"),
    SPIRIT_MIXER("Spirit w/ Mixer", 5, "Drink a Spirit w/ Mixer"),
    GUINNESS("Guinness", 5, "Drink a Guinness"),
    JAGERBOMB("Jägerbomb", 5, "Drink a Jägerbomb"),
    VK("VK", 5, "Drink a VK"),
    ;

    companion object {
        fun random(): Outcomes {
            val totalWeight = entries.sumOf { it.weight }
            val r = (0 until totalWeight).random()
            var cumulative = 0
            for (outcome in entries) {
                cumulative += outcome.weight
                if (r < cumulative) return outcome
            }
            error("Failed to pick outcome")
        }
    }
}

sealed interface PubGolfFailure {
    val message: String

    fun asErrorResponse() = ErrorResponse(message)
}

data class GameNotFoundFailure(
    override val message: String,
) : PubGolfFailure

data class PlayerAlreadyExistsFailure(
    override val message: String,
) : PubGolfFailure

data class ImFeelingLuckyUsedFailure(
    override val message: String,
) : PubGolfFailure

data class PlayerNotFoundFailure(
    override val message: String,
) : PubGolfFailure

data class PersistenceFailure(
    override val message: String,
) : PubGolfFailure

fun Game.toJpa(): GameEntity {
    val gameEntity = GameEntity(id.value, code.value)

    players.forEach { player ->
        val playerEntity =
            PlayerEntity(
                id = player.id.value,
                name = player.name.value,
                game = gameEntity,
            )

        val scoreEntities =
            player.scores
                .toList()
                .sortedBy { (hole, _) -> hole.value }
                .map { (hole, score) ->
                    ScoreEntity(
                        id = ScoreId(playerId = player.id.value, hole = hole.value),
                        player = playerEntity,
                        score = score.score.value,
                        modified = score.instant,
                    )
                }.toMutableList()

        playerEntity.scores.addAll(scoreEntities)

        player.lucky?.let { lucky ->
            val luckyEntity =
                PlayerLuckyEntity(
                    id = PlayerLuckyId(gameEntity.id, player.id.value),
                    game = gameEntity,
                    player = playerEntity,
                    hole = lucky.hole.value,
                    outcome = lucky.result.name,
                )
            playerEntity.lucky = luckyEntity
        }
        gameEntity.addPlayer(playerEntity)
    }
    return gameEntity
}
