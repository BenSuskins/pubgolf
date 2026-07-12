package uk.co.suskins.pubgolf.events

import dev.forkhandles.result4k.valueOrNull
import io.micrometer.core.instrument.MeterRegistry
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.context.ActiveProfiles
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.service.GameService
import uk.co.suskins.pubgolf.service.GameStateBroadcasterFake
import kotlin.test.assertTrue

/**
 * Proves that domain events published by the service layer actually reach the
 * transactional listeners (broadcasts + metrics). Guards against events being
 * silently discarded when published outside an active transaction.
 */
@SpringBootTest
@ActiveProfiles("test")
class GameEventDeliveryTest {
    @TestConfiguration
    class Config {
        @Bean
        @Primary
        fun gameStateBroadcasterFake() = GameStateBroadcasterFake()
    }

    @Autowired
    lateinit var gameService: GameService

    @Autowired
    lateinit var broadcaster: GameStateBroadcasterFake

    @Autowired
    lateinit var meterRegistry: MeterRegistry

    @Test
    fun `game state changes reach the broadcaster listener`() {
        broadcaster.clear()

        val game = gameService.createGame(PlayerName("Host")).valueOrNull()!!
        gameService.joinGame(game.code, PlayerName("Guest"))

        assertTrue(
            broadcaster.broadcastedGames.any { it.code == game.code },
            "Expected a game state broadcast after a player joined, but none was delivered",
        )
    }

    @Test
    fun `game lifecycle events reach the metrics listener`() {
        val createdBefore = meterRegistry.find("pubgolf.game.created").counter()?.count() ?: 0.0
        val joinedBefore = meterRegistry.find("pubgolf.player.joined").counter()?.count() ?: 0.0

        val game = gameService.createGame(PlayerName("MetricsHost")).valueOrNull()!!
        gameService.joinGame(game.code, PlayerName("MetricsGuest"))

        val createdAfter = meterRegistry.find("pubgolf.game.created").counter()?.count() ?: 0.0
        val joinedAfter = meterRegistry.find("pubgolf.player.joined").counter()?.count() ?: 0.0

        assertTrue(createdAfter > createdBefore, "Expected pubgolf.game.created to increment")
        assertTrue(joinedAfter > joinedBefore, "Expected pubgolf.player.joined to increment")
    }
}
