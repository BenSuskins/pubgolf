package uk.co.suskins.pubgolf.models

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import java.time.Instant

private val routeGeometryMapper = jacksonObjectMapper()
private val drinksMapper = jacksonObjectMapper()

data class Game(
    val id: GameId,
    val code: GameCode,
    val players: List<Player>,
    val status: GameStatus = GameStatus.ACTIVE,
    val hostPlayerId: PlayerId? = null,
    val activeEvent: ActiveEvent? = null,
    val pubs: List<Pub> = emptyList(),
    val routeGeometry: RouteGeometry? = null,
    // Empty until the host customises the course; games then fall back to the default course.
    val holes: List<CourseHole> = emptyList(),
    // Optimistic-lock version carried from the entity so stale saves are rejected; null until first persisted.
    val version: Long? = null,
) {
    fun course(): List<CourseHole> = holes.ifEmpty { Routes.defaultCourse }

    fun par(hole: Hole): Int = course().firstOrNull { it.hole == hole }?.par ?: Routes.par(hole)
}

data class Player(
    val id: PlayerId,
    val name: PlayerName,
    // Sparse: contains only holes the player has actually submitted a score for.
    val scores: Map<Hole, ScoreWithTimestamp> = emptyMap(),
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
}

data class ScoreWithTimestamp(
    val score: Score,
    val instant: Instant,
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
)

// The outcome of joining: the game's identity plus the (new or reclaimed) player.
data class JoinResult(
    val gameId: GameId,
    val gameCode: GameCode,
    val player: Player,
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
    val event: GameEvent?,
    val customTitle: String?,
    val customDescription: String?,
    val activatedAt: Instant,
) {
    init {
        require((event == null) != (customTitle == null)) {
            "ActiveEvent requires exactly one of event/customTitle"
        }
        require(event == null || customDescription == null) {
            "customDescription is only valid for custom events"
        }
    }
}

fun ActiveEvent.toResponse() =
    ActiveEventResponse(
        id = event?.id ?: "custom",
        title = event?.title ?: customTitle!!,
        description = event?.description ?: customDescription.orEmpty(),
        activatedAt = activatedAt,
    )

data class ActiveEventState(
    val activeEvent: ActiveEvent?,
)

data class Pub(
    val gameId: GameId,
    val hole: Hole,
    val name: String,
    val latitude: Double,
    val longitude: Double,
)

data class RouteGeometry(
    val type: String = "LineString",
    val coordinates: List<List<Double>>,
)

object GameConstants {
    const val MAX_HOLES = 9
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

data class InvalidPubCountFailure(
    override val message: String,
) : PubGolfFailure

data class InvalidCourseFailure(
    override val message: String,
) : PubGolfFailure

data class InvalidHostFailure(
    override val message: String,
) : PubGolfFailure

data class PlaceSearchFailure(
    override val message: String,
) : PubGolfFailure

data class RoutingFailure(
    override val message: String,
) : PubGolfFailure

data class MissingPlayerIdHeaderFailure(
    override val message: String,
) : PubGolfFailure

data class PlayerNotInGameFailure(
    override val message: String,
) : PubGolfFailure

data class ConcurrentModificationFailure(
    override val message: String,
) : PubGolfFailure

data class DuplicateGameCodeFailure(
    override val message: String,
) : PubGolfFailure

data class NoHolesLeftFailure(
    override val message: String,
) : PubGolfFailure

data class InvalidStatusTransitionFailure(
    override val message: String,
) : PubGolfFailure

data class RouteHole(
    val hole: Int,
    val par: Int,
    val drinks: Map<String, String>,
)

// A hole on a game's own course: one par, and one drink per named route.
// Iteration order of `drinks` is the order the routes are displayed in.
data class CourseHole(
    val hole: Hole,
    val par: Int,
    val drinks: Map<String, String>,
)

fun CourseHoleDto.toCourseHole(): CourseHole =
    CourseHole(
        hole = Hole(hole),
        par = par,
        drinks = drinks,
    )

object Routes {
    fun par(hole: Hole): Int = holes.first { it.hole == hole.value }.par

    // Seeds a new game's editable course and answers /config/routes for visitors without a game.
    val defaultCourse: List<CourseHole> by lazy {
        holes.map { CourseHole(Hole(it.hole), it.par, it.drinks) }
    }

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
            version = version,
            hostPlayerId = hostPlayerId?.value,
            activeEventId = activeEvent?.event?.id,
            activeEventCustomTitle = activeEvent?.customTitle,
            activeEventCustomDescription = activeEvent?.customDescription,
            activeEventActivatedAt = activeEvent?.activatedAt,
            routeGeometry = routeGeometry?.let { routeGeometryMapper.writeValueAsString(it) },
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

    pubs.forEach { pub ->
        val pubEntity = pub.toJpa(gameEntity)
        gameEntity.addPub(pubEntity)
    }

    holes.forEach { hole ->
        gameEntity.addHole(hole.toJpa(gameEntity))
    }

    return gameEntity
}

fun CourseHole.toJpa(gameEntity: GameEntity): GameHoleEntity =
    GameHoleEntity(
        id = GameHoleId(gameId = gameEntity.id, hole = hole.value),
        game = gameEntity,
        par = par,
        drinks = drinksMapper.writeValueAsString(drinks),
    )

fun Pub.toJpa(gameEntity: GameEntity): PubEntity =
    PubEntity(
        id = PubEntityId(gameId = gameEntity.id, hole = hole.value),
        game = gameEntity,
        name = name,
        latitude = latitude,
        longitude = longitude,
    )

fun PubEntity.toDomain(): Pub =
    Pub(
        gameId = GameId(id.gameId),
        hole = Hole(id.hole),
        name = name,
        latitude = latitude,
        longitude = longitude,
    )

fun Game.toGameStateResponse(): GameStateResponse =
    GameStateResponse(
        gameId = id,
        gameCode = code,
        status = status,
        hostPlayerId = hostPlayerId,
        players =
            players
                .map { player ->
                    PlayerResponse(
                        id = player.id,
                        name = player.name,
                        scores =
                            (1..GameConstants.MAX_HOLES).map { hole ->
                                player.scores[Hole(hole)]?.score
                            },
                        totalScore = player.scores.values.sumOf { it.score.value },
                        parRelative =
                            player.scores.entries.sumOf { (hole, score) ->
                                score.score.value - par(hole)
                            },
                        randomise =
                            player.randomise?.let {
                                RandomiseOutcomeResponse(it.hole, it.result.label)
                            },
                        penalties =
                            player.penalties.map { penalty ->
                                PenaltyResponse(penalty.hole, penalty.type.name, penalty.type.points)
                            },
                    )
                }.sortedWith(
                    compareBy(
                        { it.parRelative },
                        { -it.scores.count { score -> score != null } },
                    ),
                ),
        activeEvent = activeEvent?.toResponse(),
        holes = course().map { HoleResponse(it.hole.value, it.par, it.drinks) },
    )
