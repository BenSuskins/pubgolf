package uk.co.suskins.pubgolf.models

import java.time.Instant

data class Game(
    val id: GameId,
    val code: GameCode,
    val players: List<Player>,
    val status: GameStatus = GameStatus.ACTIVE,
    val hostPlayerId: PlayerId? = null,
    val activeEvent: ActiveEvent? = null,
)

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val scores: Map<Hole, ScoreWithTimestamp> = initialScore(),
    val randomise: Randomise? = null,
    val penalties: List<Penalty> = emptyList(),
) {
    fun matches(playerId: PlayerId) = id.value == playerId.value

    fun updateScore(
        hole: Hole,
        score: Score,
    ) = copy(scores = scores + (hole to ScoreWithTimestamp(score, Instant.now())))

    fun updateRandomise(
        hole: Hole,
        result: Outcomes,
    ) = copy(randomise = Randomise(hole, result))

    fun updatePenalty(
        hole: Hole,
        penaltyType: PenaltyType,
    ) = copy(penalties = penalties.filter { it.hole != hole } + Penalty(hole, penaltyType))

    fun removePenalty(hole: Hole) = copy(penalties = penalties.filter { it.hole != hole })

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

data class Randomise(
    val hole: Hole,
    val result: Outcomes,
)

data class Penalty(
    val hole: Hole,
    val type: PenaltyType,
)

data class RandomiseResult(
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

enum class GameEvent(
    val id: String,
    val title: String,
    val description: String,
) {
    PHOTO_OP("photo-op", "Photo Op!", "Everyone must take a group photo at the current venue"),
    SPEED_ROUND("speed-round", "Speed Round", "Finish your current drink within 2 minutes"),
    HALFTIME("halftime", "Halftime", "Take a 5-minute break"),
    LAST_ORDERS("last-orders", "Last Orders", "Final warning before moving to next venue"),
    CLUB_SWAP("club-swap", "Club Swap", "You must drink with your non-dominant hand, getting caught is a +1 penalty"),
    STRANGER_DANGER("stranger-danger", "Stranger Danger", "Convince a stranger to buy you a drink, -2 points"),
    ;

    companion object {
        fun fromId(id: String): GameEvent? = entries.find { it.id == id }
    }
}

data class ActiveEvent(
    val event: GameEvent,
    val activatedAt: Instant,
)

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

data class RandomiseAlreadyUsedFailure(
    override val message: String,
) : PubGolfFailure

data class PlayerNotFoundFailure(
    override val message: String,
) : PubGolfFailure

data class PersistenceFailure(
    override val message: String,
) : PubGolfFailure

data class GameAlreadyCompletedFailure(
    override val message: String,
) : PubGolfFailure

data class NotHostPlayerFailure(
    override val message: String,
) : PubGolfFailure

data class EventAlreadyActiveFailure(
    override val message: String,
) : PubGolfFailure

data class EventNotFoundFailure(
    override val message: String,
) : PubGolfFailure

data class RouteHole(
    val hole: Int,
    val par: Int,
    val drinks: Map<String, String>,
)

object Routes {
    val holes: List<RouteHole> =
        listOf(
            RouteHole(1, 1, mapOf("Route A" to "Tequila", "Route B" to "Sambuca")),
            RouteHole(2, 3, mapOf("Route A" to "Beer", "Route B" to "Double Vodka & Single Vodka w/ Mixer")),
            RouteHole(3, 2, mapOf("Route A" to "Wine", "Route B" to "Double Gin w/ Mixer")),
            RouteHole(4, 2, mapOf("Route A" to "Cider", "Route B" to "Double Rum w/ Mixer")),
            RouteHole(5, 2, mapOf("Route A" to "Cocktail", "Route B" to "Cocktail")),
            RouteHole(6, 2, mapOf("Route A" to "Spirit w/ Mixer", "Route B" to "Spirit w/ Mixer")),
            RouteHole(7, 4, mapOf("Route A" to "Guinness", "Route B" to "2 x Double Whiskey w/ Mixer")),
            RouteHole(8, 1, mapOf("Route A" to "Jägerbomb", "Route B" to "Jägerbomb")),
            RouteHole(9, 1, mapOf("Route A" to "VK", "Route B" to "Smirnoff Ice")),
        )
}

fun Game.toJpa(): GameEntity {
    val gameEntity =
        GameEntity(
            id = id.value,
            code = code.value,
            status = status,
            hostPlayerId = hostPlayerId?.value,
            activeEventId = activeEvent?.event?.id,
            activeEventActivatedAt = activeEvent?.activatedAt,
        )

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

        player.randomise?.let { randomise ->
            val randomiseEntity =
                PlayerRandomiseEntity(
                    id = PlayerRandomiseId(gameEntity.id, player.id.value),
                    game = gameEntity,
                    player = playerEntity,
                    hole = randomise.hole.value,
                    outcome = randomise.result.name,
                )
            playerEntity.randomise = randomiseEntity
        }

        val penaltyEntities =
            player.penalties.map { penalty ->
                PlayerPenaltyEntity(
                    id = PlayerPenaltyId(playerId = player.id.value, hole = penalty.hole.value),
                    player = playerEntity,
                    penaltyType = penalty.type,
                )
            }
        playerEntity.penalties.addAll(penaltyEntities)

        gameEntity.addPlayer(playerEntity)
    }
    return gameEntity
}
