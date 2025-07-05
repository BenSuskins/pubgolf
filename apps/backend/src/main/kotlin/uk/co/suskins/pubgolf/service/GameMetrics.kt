package uk.co.suskins.pubgolf.service

import io.micrometer.core.instrument.MeterRegistry
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Hole

@Service
class GameMetrics(private val registry: MeterRegistry) {

    fun gameCreated() {
        registry.counter("pubgolf.game.created").increment()
    }

    fun playerJoined() {
        registry.counter("pubgolf.player.joined").increment()
    }

    fun scoreSubmitted(hole: Hole) {
        registry.counter("pubgolf.score.submitted", "hole", hole.value.toString()).increment()
    }

    fun imFeelingLuckyUsed() {
        registry.counter("pubgolf.game.lucky").increment()
    }
}