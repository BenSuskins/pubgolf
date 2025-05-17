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
)

fun initialScore() =
    mapOf(1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0)

sealed interface PubGolfFailure
data class GameNotFoundFailure(val message: String) : PubGolfFailure
data class PlayerNotFoundFailure(val message: String) : PubGolfFailure
