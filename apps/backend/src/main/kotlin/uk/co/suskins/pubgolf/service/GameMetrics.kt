package uk.co.suskins.pubgolf.service

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.GameConstants
import uk.co.suskins.pubgolf.models.Hole

@Service
class GameMetrics(
    private val registry: MeterRegistry,
) {
    private val gameStartedCounter = registry.counter(GAME_STARTED)
    private val playerJoinedCounter = registry.counter(PLAYER_JOINED)
    private val randomiseUsedCounter = registry.counter(GAME_RANDOMISE)
    private val gameCompletedCounter = registry.counter(GAME_COMPLETED)
    private val scoreSubmittedCounters =
        (1..GameConstants.MAX_HOLES).associateWith(::scoreSubmittedCounter)

    fun gameCreated() {
        gameStartedCounter.increment()
    }

    fun playerJoined() {
        playerJoinedCounter.increment()
    }

    fun scoreSubmitted(hole: Hole) {
        scoreSubmittedCounters
            .getOrElse(hole.value) { scoreSubmittedCounter(hole.value) }
            .increment()
    }

    fun randomiseUsed() {
        randomiseUsedCounter.increment()
    }

    fun gameCompleted() {
        gameCompletedCounter.increment()
    }

    private fun scoreSubmittedCounter(hole: Int): Counter = registry.counter(SCORE_SUBMITTED, "hole", hole.toString())

    companion object {
        const val GAME_STARTED = "pubgolf.game.started"
        const val PLAYER_JOINED = "pubgolf.player.joined"
        const val SCORE_SUBMITTED = "pubgolf.score.submitted"
        const val GAME_RANDOMISE = "pubgolf.game.randomise"
        const val GAME_COMPLETED = "pubgolf.game.completed"

        val ALL_METRIC_NAMES =
            listOf(GAME_STARTED, PLAYER_JOINED, SCORE_SUBMITTED, GAME_RANDOMISE, GAME_COMPLETED)
    }
}
