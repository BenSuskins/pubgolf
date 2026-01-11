package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.isA
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventId
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.NoActiveEventFailure
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.repository.GameRepositoryFake
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

private val gameCode = GameCode("ACE007")
private val hostPlayerId = PlayerId.random()
private val nonHostPlayerId = PlayerId.random()

class EventServiceTest {
    private val gameRepository = GameRepositoryFake()
    private val activeEventStore = ActiveEventStore()
    private val gameBroadcastService = GameBroadcastServiceFake(gameRepository)
    private val service = EventService(gameRepository, activeEventStore, gameBroadcastService)

    @Test
    fun `can get available events`() {
        val events = service.getAvailableEvents()

        assertThat(events.size, equalTo(6))
        assertTrue(events.any { it.name == "Power Hour" })
    }

    @Test
    fun `can start an event`() {
        createActiveGame()

        val result = service.startEvent(gameCode, hostPlayerId, EventId("power-hour"))

        assertThat(result, isSuccess())
        val event = result.valueOrNull()!!
        assertThat(event.name, equalTo("Power Hour"))
        assertNotNull(service.getActiveEvent(gameCode))
    }

    @Test
    fun `cannot start event when another is active`() {
        createActiveGame()
        service.startEvent(gameCode, hostPlayerId, EventId("power-hour"))

        val result = service.startEvent(gameCode, hostPlayerId, EventId("double-trouble"))

        assertThat(result, isFailure(isA<EventAlreadyActiveFailure>()))
    }

    @Test
    fun `cannot start event on completed game`() {
        createCompletedGame()

        val result = service.startEvent(gameCode, hostPlayerId, EventId("power-hour"))

        assertThat(result, isFailure(isA<GameAlreadyCompletedFailure>()))
    }

    @Test
    fun `non-host cannot start event`() {
        createActiveGame()

        val result = service.startEvent(gameCode, nonHostPlayerId, EventId("power-hour"))

        assertThat(result, isFailure(isA<NotHostPlayerFailure>()))
    }

    @Test
    fun `cannot start event for non-existent game`() {
        val result = service.startEvent(GameCode("NOPE123"), hostPlayerId, EventId("power-hour"))

        assertThat(result, isFailure(isA<GameNotFoundFailure>()))
    }

    @Test
    fun `cannot start non-existent event`() {
        createActiveGame()

        val result = service.startEvent(gameCode, hostPlayerId, EventId("non-existent"))

        assertThat(result, isFailure(isA<EventNotFoundFailure>()))
    }

    @Test
    fun `can end an active event`() {
        createActiveGame()
        service.startEvent(gameCode, hostPlayerId, EventId("power-hour"))

        val result = service.endCurrentEvent(gameCode, hostPlayerId)

        assertThat(result, isSuccess())
        assertNull(service.getActiveEvent(gameCode))
    }

    @Test
    fun `cannot end event when none is active`() {
        createActiveGame()

        val result = service.endCurrentEvent(gameCode, hostPlayerId)

        assertThat(result, isFailure(isA<NoActiveEventFailure>()))
    }

    @Test
    fun `non-host cannot end event`() {
        createActiveGame()
        service.startEvent(gameCode, hostPlayerId, EventId("power-hour"))

        val result = service.endCurrentEvent(gameCode, nonHostPlayerId)

        assertThat(result, isFailure(isA<NotHostPlayerFailure>()))
    }

    @Test
    fun `starting event broadcasts event start`() {
        createActiveGame()

        service.startEvent(gameCode, hostPlayerId, EventId("power-hour"))

        val broadcasts = gameBroadcastService.eventStartBroadcasts
        assertThat(broadcasts.size, equalTo(1))
        assertThat(broadcasts[0].first, equalTo(gameCode))
        assertThat(broadcasts[0].second.name, equalTo("Power Hour"))
    }

    @Test
    fun `ending event broadcasts event end`() {
        createActiveGame()
        service.startEvent(gameCode, hostPlayerId, EventId("double-trouble"))

        service.endCurrentEvent(gameCode, hostPlayerId)

        val broadcasts = gameBroadcastService.eventEndBroadcasts
        assertThat(broadcasts.size, equalTo(1))
        assertThat(broadcasts[0].first, equalTo(gameCode))
        assertThat(broadcasts[0].second.name, equalTo("Double Trouble"))
    }

    @Test
    fun `get active event returns null when none active`() {
        createActiveGame()

        val event = service.getActiveEvent(gameCode)

        assertNull(event)
    }

    @Test
    fun `get active event returns event when active`() {
        createActiveGame()
        service.startEvent(gameCode, hostPlayerId, EventId("lefty-lucy"))

        val event = service.getActiveEvent(gameCode)

        assertNotNull(event)
        assertThat(event.name, equalTo("Lefty Lucy"))
    }

    private fun createActiveGame() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players =
                    listOf(
                        Player(hostPlayerId, PlayerName("Host")),
                        Player(nonHostPlayerId, PlayerName("Player")),
                    ),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayerId,
            )
        gameRepository.save(game)
    }

    private fun createCompletedGame() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players =
                    listOf(
                        Player(hostPlayerId, PlayerName("Host")),
                    ),
                status = GameStatus.COMPLETED,
                hostPlayerId = hostPlayerId,
            )
        gameRepository.save(game)
    }
}
