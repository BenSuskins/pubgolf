package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.models.Hole

class GameMetricsTest {
    private val registry = SimpleMeterRegistry()
    private val gameMetrics = GameMetrics(registry)

    @Test
    fun `Can increment game created counter`() {
        gameMetrics.gameCreated()

        assertThat(registry.get("pubgolf.game.created").counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment player joined counter`() {
        gameMetrics.playerJoined()

        assertThat(registry.get("pubgolf.player.joined").counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment score submitted counter`() {
        gameMetrics.scoreSubmitted(Hole(1))

        val metric = registry.get("pubgolf.score.submitted")
        assertThat(metric.counter().count(), equalTo(1.0))
        assertThat(metric.tags("hole", "1").counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment randomise counter`() {
        gameMetrics.randomiseUsed()

        assertThat(registry.get("pubgolf.game.randomise").counter().count(), equalTo(1.0))
    }
}
