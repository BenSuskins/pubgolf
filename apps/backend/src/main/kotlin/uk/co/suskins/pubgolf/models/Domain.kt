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
    val scores: Map<Int, Int> = emptyMap()
)

sealed interface PubGolfFailure
data class NotFoundFailure(val message: String) : PubGolfFailure