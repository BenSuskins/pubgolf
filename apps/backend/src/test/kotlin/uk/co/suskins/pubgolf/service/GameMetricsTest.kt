package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import io.prometheus.metrics.model.snapshots.PrometheusNaming
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.models.GameConstants
import uk.co.suskins.pubgolf.models.Hole

class GameMetricsTest {
    private val registry = SimpleMeterRegistry()
    private val gameMetrics = GameMetrics(registry)

    @Test
    fun `Can increment game started counter`() {
        gameMetrics.gameCreated()

        assertThat(registry.get(GameMetrics.GAME_STARTED).counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment player joined counter`() {
        gameMetrics.playerJoined()

        assertThat(registry.get(GameMetrics.PLAYER_JOINED).counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment score submitted counter`() {
        gameMetrics.scoreSubmitted(Hole(1))

        val metric = registry.get(GameMetrics.SCORE_SUBMITTED)
        assertThat(metric.tags("hole", "1").counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment randomise counter`() {
        gameMetrics.randomiseUsed()

        assertThat(registry.get(GameMetrics.GAME_RANDOMISE).counter().count(), equalTo(1.0))
    }

    @Test
    fun `Can increment game completed counter`() {
        gameMetrics.gameCompleted()

        assertThat(registry.get(GameMetrics.GAME_COMPLETED).counter().count(), equalTo(1.0))
    }

    @Test
    fun `Counters are registered at zero before anything happens`() {
        GameMetrics.ALL_METRIC_NAMES.forEach { name ->
            assertThat(registry.get(name).counter().count(), equalTo(0.0))
        }
    }

    @Test
    fun `Every hole has a score submitted counter registered at zero`() {
        (1..GameConstants.MAX_HOLES).forEach { hole ->
            val counter = registry.get(GameMetrics.SCORE_SUBMITTED).tags("hole", hole.toString()).counter()
            assertThat(counter.count(), equalTo(0.0))
        }
    }

    @Test
    fun `Scores on an unexpected hole are still counted`() {
        val unexpectedHole = GameConstants.MAX_HOLES + 1

        gameMetrics.scoreSubmitted(Hole(unexpectedHole))

        val counter =
            registry
                .get(GameMetrics.SCORE_SUBMITTED)
                .tags("hole", unexpectedHole.toString())
                .counter()
        assertThat(counter.count(), equalTo(1.0))
    }

    @Test
    fun `Metric names survive Prometheus naming without being rewritten`() {
        GameMetrics.ALL_METRIC_NAMES.forEach { name ->
            assertThat(PrometheusNaming.sanitizeMetricName(name), equalTo(name))
        }
    }

    @Test
    fun `Reserved Prometheus suffixes are silently stripped from metric names`() {
        assertThat(PrometheusNaming.sanitizeMetricName("pubgolf.game.created"), equalTo("pubgolf.game"))
    }
}
