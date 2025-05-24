package uk.co.suskins.pubgolf.models

import java.util.*
import kotlin.random.Random

@JvmInline
value class GameCode(val value: String) {
    companion object {
        private val golfTerms = listOf("PAR", "BIRDIE", "BOGEY", "EAGLE", "ALBATROSS", "ACE", "FORE", "HOOK", "SLICE")
        fun random() = GameCode("${golfTerms.random()}${Random.nextInt(0, 1000).toString().padStart(3, '0')}")
    }
}

@JvmInline
value class PlayerName(val value: String)

@JvmInline
value class Score(val value: Int)

@JvmInline
value class Hole(val value: Int)

@JvmInline
value class PlayerId(val value: UUID) {
    companion object {
        fun random() = PlayerId(UUID.randomUUID())
    }
}

@JvmInline
value class GameId(val value: UUID) {
    companion object {
        fun random() = GameId(UUID.randomUUID())
    }
}
