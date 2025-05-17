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
    mapOf(0 to 0, 0 to 0, 0 to 0, 0 to 0, 0 to 0, 0 to 0, 0 to 0, 0 to 0, 0 to 0)

sealed interface PubGolfFailure
data class GameNotFoundFailure(val message: String) : PubGolfFailure
data class PlayerNotFoundFailure(val message: String) : PubGolfFailure
