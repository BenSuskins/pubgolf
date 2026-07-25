package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.isA
import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.failureOrNull
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import uk.co.suskins.pubgolf.events.CourseUpdatedEvent
import uk.co.suskins.pubgolf.events.GameEventCaptor
import uk.co.suskins.pubgolf.events.GameStateChangedEvent
import uk.co.suskins.pubgolf.models.ActiveEvent
import uk.co.suskins.pubgolf.models.ConcurrentModificationFailure
import uk.co.suskins.pubgolf.models.CourseHole
import uk.co.suskins.pubgolf.models.DuplicateGameCodeFailure
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameConstants
import uk.co.suskins.pubgolf.models.GameEvent
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.InvalidCourseFailure
import uk.co.suskins.pubgolf.models.NoHolesLeftFailure
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.Routes
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.models.toGameStateResponse
import uk.co.suskins.pubgolf.repository.GameRepository
import uk.co.suskins.pubgolf.repository.GameRepositoryFake
import java.time.Instant
import java.util.UUID
import kotlin.test.assertTrue

private val gameCode = GameCode("ACE007")
private val host = PlayerName("Ben")

class GameServiceTest {
    private val gameRepository = GameRepositoryFake()
    private val eventCaptor = GameEventCaptor()
    private val eventPublisher =
        ApplicationEventPublisher { event -> eventCaptor.captureEvent(event as uk.co.suskins.pubgolf.events.GameEvent) }
    private val service = GameService(gameRepository, eventPublisher)

    @BeforeEach
    fun setup() {
        eventCaptor.clear()
    }

    @Test
    fun `can create game`() {
        val result = service.createGame(host)

        assertThat(result, isSuccess())
        val game = result.valueOrNull()!!
        assertThat(game.id.value, isA<UUID>())
        assertTrue(game.code.isValidGameCode())
    }

    @Test
    fun `can create game with a host`() {
        val result = service.createGame(host)

        val game = result.valueOrNull()!!
        val hostPlayer = game.players.first()

        assertThat(game.players.size, equalTo(1))
        assertThat(hostPlayer.name, equalTo(host))
        assertTrue(hostPlayer.scores.isEmpty())
    }

    @Test
    fun `can join a game`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, PlayerName("Megan"))

        assertThat(result, isSuccess())
        val joined = result.valueOrNull()!!
        assertThat(joined.player.name, equalTo(PlayerName("Megan")))

        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertTrue(updatedGame.hasPlayer("Ben"))
        assertTrue(updatedGame.hasPlayer("Megan"))
        val ben = updatedGame.players.find { it.name.value == "Ben" }!!
        val megan = updatedGame.players.find { it.name.value == "Megan" }!!
        assertTrue(ben.scores.isEmpty())
        assertTrue(megan.scores.isEmpty())
    }

    @Test
    fun `fail to join a game that doesn't exist`() {
        val result = service.joinGame(gameCode, PlayerName("Megan"))

        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }

    @Test
    fun `can rejoin as an existing player by name`() {
        val existingPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(existingPlayer),
            )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, PlayerName("ben"), rejoin = true)

        assertThat(result, isSuccess())
        val rejoined = result.valueOrNull()!!
        assertThat(rejoined.player.id, equalTo(existingPlayer.id))
    }

    @Test
    fun `rejoin with an unknown name joins as a new player`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, PlayerName("Megan"), rejoin = true)

        assertThat(result, isSuccess())
        assertTrue(gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!.hasPlayer("Megan"))
    }

    @Test
    fun `fail to join a game with a name that already exists`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, host)

        assertThat(result, isFailure(PlayerAlreadyExistsFailure("Player `Ben` already exists for game `ACE007`.")))
    }

    @Test
    fun `can get the state of a game`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val result = service.gameState(gameCode)

        assertThat(result, isSuccess())
        val gameState = result.valueOrNull()!!
        assertThat(gameState, equalTo(game))
    }

    @Test
    fun `fail to get the state of a game that doesn't exist`() {
        val result = service.gameState(gameCode)

        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }

    @Test
    fun `can submit a score`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
            )
        gameRepository.save(game)

        val result = service.submitScore(gameCode, player.id, Hole(2), Score(4))

        assertThat(result, isSuccess())

        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(
            updatedGame.players
                .find { it.name == host }!!
                .scores
                .mapValues { it.value.score },
            equalTo(
                mapOf(
                    Hole(2) to Score(4),
                ),
            ),
        )
    }

    @Test
    fun `fail to get submit a score for a game that doesn't exist`() {
        val result = service.submitScore(gameCode, PlayerId.random(), Hole(2), Score(4))

        assertThat(result, isFailure(GameNotFoundFailure("Game `${gameCode.value}` not found.")))
    }

    @Test
    fun `fail to get submit a score for a player that doesn't exist`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val playerId = PlayerId.random()
        val result = service.submitScore(gameCode, playerId, Hole(2), Score(4))

        assertThat(result, isFailure(PlayerNotFoundFailure("Player `${playerId.value}` not found for game `ACE007`.")))
    }

    @Test
    fun `can use randomise`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
            )
        gameRepository.save(game)
        service.submitScore(gameCode, player.id, Hole(1), Score(5))

        val result = service.randomise(gameCode, player.id)

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        val randomise = updatedGame.players.find { it.name == host }!!.randomise
        assertThat(randomise!!.hole, equalTo(Hole(2)))
    }

    @Test
    fun `fail to use randomise for a game that doesn't exist`() {
        val result = service.randomise(gameCode, PlayerId.random())

        assertThat(result, isFailure(GameNotFoundFailure("Game `${gameCode.value}` not found.")))
    }

    @Test
    fun `fail to use randomise for a player that doesn't exist`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val playerId = PlayerId.random()
        val result = service.randomise(gameCode, playerId)

        assertThat(result, isFailure(PlayerNotFoundFailure("Player `${playerId.value}` not found for game `ACE007`.")))
    }

    @Test
    fun `randomise targets the first unplayed hole`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
            )
        gameRepository.save(game)
        service.submitScore(gameCode, player.id, Hole(1), Score(3))
        service.submitScore(gameCode, player.id, Hole(2), Score(3))
        service.submitScore(gameCode, player.id, Hole(9), Score(2))

        val result = service.randomise(gameCode, player.id)

        assertThat(result, isSuccess())
        assertThat(result.valueOrNull()!!.hole, equalTo(Hole(3)))
    }

    @Test
    fun `fail to use randomise when all holes are played`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
            )
        gameRepository.save(game)
        for (hole in 1..9) {
            service.submitScore(gameCode, player.id, Hole(hole), Score(2))
        }

        val result = service.randomise(gameCode, player.id)

        assertThat(result, isFailure(NoHolesLeftFailure("No more holes left")))
    }

    @Test
    fun `creating game sets first player as host`() {
        val result = service.createGame(host)

        val game = result.valueOrNull()!!
        assertThat(game.hostPlayerId, equalTo(game.players.first().id))
    }

    @Test
    fun `creating game sets status to ACTIVE`() {
        val result = service.createGame(host)

        val game = result.valueOrNull()!!
        assertThat(game.status, equalTo(GameStatus.ACTIVE))
    }

    @Test
    fun `host can complete a game`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.completeGame(gameCode, hostPlayer.id)

        assertThat(result, isSuccess())
        val completedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(completedGame.status, equalTo(GameStatus.COMPLETED))
    }

    @Test
    fun `non-host cannot complete a game`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val otherPlayer = Player(PlayerId.random(), PlayerName("Other"))
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer, otherPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.completeGame(gameCode, otherPlayer.id)

        assertThat(result, isFailure(NotHostPlayerFailure("Only the host can complete this game")))
    }

    @Test
    fun `cannot complete already completed game`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.COMPLETED,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.completeGame(gameCode, hostPlayer.id)

        assertThat(result, isFailure(GameAlreadyCompletedFailure("Game is already completed")))
    }

    @Test
    fun `cannot submit score to completed game`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
                status = GameStatus.COMPLETED,
                hostPlayerId = player.id,
            )
        gameRepository.save(game)

        val result = service.submitScore(gameCode, player.id, Hole(2), Score(4))

        assertThat(result, isFailure(GameAlreadyCompletedFailure("Cannot submit score to completed game")))
    }

    @Test
    fun `cannot join completed game`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.COMPLETED,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, PlayerName("NewPlayer"))

        assertThat(result, isFailure(GameAlreadyCompletedFailure("This game has ended")))
    }

    @Test
    fun `cannot use randomise on completed game`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
                status = GameStatus.COMPLETED,
                hostPlayerId = player.id,
            )
        gameRepository.save(game)

        val result = service.randomise(gameCode, player.id)

        assertThat(result, isFailure(GameAlreadyCompletedFailure("Cannot randomise on completed game")))
    }

    @Test
    fun `get available events returns all events`() {
        val events = service.getAvailableEvents()

        assertThat(events.size, equalTo(GameEvent.entries.size))
        assertTrue(events.contains(GameEvent.PHOTO_OP))
        assertTrue(events.contains(GameEvent.SPEED_ROUND))
    }

    @Test
    fun `host can activate event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.activateEvent(gameCode, hostPlayer.id, "photo-op")

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(updatedGame.activeEvent!!.event, equalTo(GameEvent.PHOTO_OP))
    }

    @Test
    fun `non-host cannot activate event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val otherPlayer = Player(PlayerId.random(), PlayerName("Other"))
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer, otherPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.activateEvent(gameCode, otherPlayer.id, "photo-op")

        assertThat(result, isFailure(NotHostPlayerFailure("Only the host can activate events")))
    }

    @Test
    fun `cannot activate event when one is already active`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent =
                    ActiveEvent(
                        event = GameEvent.PHOTO_OP,
                        customTitle = null,
                        customDescription = null,
                        activatedAt = Instant.now(),
                    ),
            )
        gameRepository.save(game)

        val result = service.activateEvent(gameCode, hostPlayer.id, "speed-round")

        assertThat(
            result,
            isFailure(
                EventAlreadyActiveFailure(
                    "An event is already active. End the current event before activating a new one.",
                ),
            ),
        )
    }

    @Test
    fun `cannot activate event on completed game`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.COMPLETED,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.activateEvent(gameCode, hostPlayer.id, "photo-op")

        assertThat(result, isFailure(GameAlreadyCompletedFailure("Cannot activate event on completed game")))
    }

    @Test
    fun `cannot activate invalid event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.activateEvent(gameCode, hostPlayer.id, "invalid-event")

        assertThat(result, isFailure(EventNotFoundFailure("Event 'invalid-event' not found")))
    }

    @Test
    fun `host can activate custom event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.activateCustomEvent(gameCode, hostPlayer.id, "  Nachos time  ", "  Everyone orders nachos  ")

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        val activeEvent = updatedGame.activeEvent!!
        assertThat(activeEvent.customTitle, equalTo("Nachos time"))
        assertThat(activeEvent.customDescription, equalTo("Everyone orders nachos"))
        assertThat(activeEvent.event, equalTo(null))
    }

    @Test
    fun `host can activate custom event with no description`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.activateCustomEvent(gameCode, hostPlayer.id, "Nachos time", null)

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        val activeEvent = updatedGame.activeEvent!!
        assertThat(activeEvent.customTitle, equalTo("Nachos time"))
        assertThat(activeEvent.customDescription, equalTo(null))
    }

    @Test
    fun `cannot activate custom event when a built-in event is already active`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent =
                    ActiveEvent(
                        event = GameEvent.PHOTO_OP,
                        customTitle = null,
                        customDescription = null,
                        activatedAt = Instant.now(),
                    ),
            )
        gameRepository.save(game)

        val result = service.activateCustomEvent(gameCode, hostPlayer.id, "Nachos time", null)

        assertThat(
            result,
            isFailure(
                EventAlreadyActiveFailure(
                    "An event is already active. End the current event before activating a new one.",
                ),
            ),
        )
    }

    @Test
    fun `cannot activate a built-in event when a custom event is already active`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent = ActiveEvent(event = null, customTitle = "Nachos time", customDescription = null, activatedAt = Instant.now()),
            )
        gameRepository.save(game)

        val result = service.activateEvent(gameCode, hostPlayer.id, "photo-op")

        assertThat(
            result,
            isFailure(
                EventAlreadyActiveFailure(
                    "An event is already active. End the current event before activating a new one.",
                ),
            ),
        )
    }

    @Test
    fun `host can end active custom event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent = ActiveEvent(event = null, customTitle = "Nachos time", customDescription = null, activatedAt = Instant.now()),
            )
        gameRepository.save(game)

        val result = service.endEvent(gameCode, hostPlayer.id)

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(updatedGame.activeEvent, equalTo(null))
    }

    @Test
    fun `host can end active event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent =
                    ActiveEvent(
                        event = GameEvent.PHOTO_OP,
                        customTitle = null,
                        customDescription = null,
                        activatedAt = Instant.now(),
                    ),
            )
        gameRepository.save(game)

        val result = service.endEvent(gameCode, hostPlayer.id)

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(updatedGame.activeEvent, equalTo(null))
    }

    @Test
    fun `ending event when none active is no-op`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.endEvent(gameCode, hostPlayer.id)

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(updatedGame.activeEvent, equalTo(null))
    }

    @Test
    fun `active event is cleared when game completes`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent =
                    ActiveEvent(
                        event = GameEvent.PHOTO_OP,
                        customTitle = null,
                        customDescription = null,
                        activatedAt = Instant.now(),
                    ),
            )
        gameRepository.save(game)

        val result = service.completeGame(gameCode, hostPlayer.id)

        assertThat(result, isSuccess())
        val completedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(completedGame.status, equalTo(GameStatus.COMPLETED))
        assertThat(completedGame.activeEvent, equalTo(null))
    }

    @Test
    fun `get active event returns current event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val activeEvent = ActiveEvent(event = GameEvent.PHOTO_OP, customTitle = null, customDescription = null, activatedAt = Instant.now())
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent = activeEvent,
            )
        gameRepository.save(game)

        val result = service.getActiveEvent(gameCode)

        assertThat(result, isSuccess())
        val eventState = result.valueOrNull()!!
        assertThat(eventState.activeEvent!!.event, equalTo(GameEvent.PHOTO_OP))
    }

    @Test
    fun `get active event returns null when no event active`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val result = service.getActiveEvent(gameCode)

        assertThat(result, isSuccess())
        assertThat(result.valueOrNull()!!.activeEvent, equalTo(null))
    }

    @Test
    fun `join retries after a concurrent modification and succeeds`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val flakyService = GameService(FlakyGameRepository(gameRepository, failuresRemaining = 1), eventPublisher)

        val result = flakyService.joinGame(gameCode, PlayerName("Megan"))

        assertThat(result, isSuccess())
        assertTrue(gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!.hasPlayer("Megan"))
    }

    @Test
    fun `host can set drinks and pars`() {
        val hostPlayer = hostGame()

        val result = service.setCourse(gameCode, hostPlayer.id, course())

        assertThat(result, isSuccess())
        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertThat(updatedGame.holes.size, equalTo(GameConstants.MAX_HOLES))
        assertThat(updatedGame.par(Hole(1)), equalTo(2))
        assertThat(updatedGame.holes.first().drinks, equalTo(mapOf("Ale Trail" to "Drink 1")))
        assertThat(eventCaptor.getEventsOfType<CourseUpdatedEvent>().single().routeNames, equalTo(listOf("Ale Trail")))
        assertTrue(eventCaptor.getEventsOfType<GameStateChangedEvent>().isNotEmpty())
    }

    @Test
    fun `setting the course trims names and orders holes and routes consistently`() {
        val hostPlayer = hostGame()
        val jumbled =
            course(routes = listOf(" Ale Trail ", "Spirit Run"))
                .reversed()
                .map { hole ->
                    // Route order differs per hole on the wire; the saved course must not.
                    if (hole.hole.value % 2 ==
                        0
                    ) {
                        hole.copy(
                            drinks =
                                hole.drinks.entries
                                    .reversed()
                                    .associate { it.key to it.value },
                        )
                    } else {
                        hole
                    }
                }

        val result = service.setCourse(gameCode, hostPlayer.id, jumbled)

        assertThat(result, isSuccess())
        val saved = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!.holes
        assertThat(saved.map { it.hole.value }, equalTo((1..GameConstants.MAX_HOLES).toList()))
        saved.forEach { hole ->
            assertThat(hole.drinks.keys.toList(), equalTo(listOf("Ale Trail", "Spirit Run")))
        }
    }

    @Test
    fun `par relative uses the game's own pars`() {
        val hostPlayer = hostGame()
        service.setCourse(gameCode, hostPlayer.id, course())
        service.submitScore(gameCode, hostPlayer.id, Hole(1), Score(3))

        val response = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!.toGameStateResponse()

        // Par 2 on the custom course where the default course has par 1.
        assertThat(response.players.first().parRelative, equalTo(1))
        assertThat(response.holes.first().par, equalTo(2))
    }

    @Test
    fun `game state falls back to the default course until the host edits it`() {
        hostGame()

        val response = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!.toGameStateResponse()

        assertThat(response.holes.size, equalTo(GameConstants.MAX_HOLES))
        assertThat(response.holes.first().par, equalTo(Routes.holes.first().par))
        assertThat(response.holes.first().drinks, equalTo(Routes.holes.first().drinks))
    }

    @Test
    fun `only the host can set drinks and pars`() {
        hostGame()
        val otherPlayer = Player(PlayerId.random(), PlayerName("Megan"))
        val game = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        gameRepository.save(game.copy(players = game.players + otherPlayer))

        val result = service.setCourse(gameCode, otherPlayer.id, course())

        assertThat(result, isFailure(NotHostPlayerFailure("Only the host can change drinks and pars")))
    }

    @Test
    fun `cannot set drinks and pars on a completed game`() {
        val hostPlayer = hostGame(status = GameStatus.COMPLETED)

        val result = service.setCourse(gameCode, hostPlayer.id, course())

        assertThat(result, isFailure(GameAlreadyCompletedFailure("Cannot change the course of a completed game")))
    }

    @Test
    fun `cannot set a course with a missing hole`() {
        val hostPlayer = hostGame()

        val result = service.setCourse(gameCode, hostPlayer.id, course().drop(1))

        assertThat(result, isFailure(InvalidCourseFailure("Each hole from 1 to 9 must be set exactly once")))
    }

    @Test
    fun `cannot set a course with a duplicated hole`() {
        val hostPlayer = hostGame()
        val holes = course()

        val result = service.setCourse(gameCode, hostPlayer.id, holes.dropLast(1) + holes.first())

        assertThat(result, isFailure(InvalidCourseFailure("Each hole from 1 to 9 must be set exactly once")))
    }

    @Test
    fun `cannot set a par outside the allowed range`() {
        val hostPlayer = hostGame()
        val holes = course().map { if (it.hole == Hole(4)) it.copy(par = 11) else it }

        val result = service.setCourse(gameCode, hostPlayer.id, holes)

        assertThat(result, isFailure(InvalidCourseFailure("Par for hole 4 must be between 1 and 10")))
    }

    @Test
    fun `cannot set a course with no routes`() {
        val hostPlayer = hostGame()

        val result = service.setCourse(gameCode, hostPlayer.id, course(routes = emptyList()))

        assertThat(result, isFailure(InvalidCourseFailure("A course needs between 1 and 4 routes")))
    }

    @Test
    fun `cannot set a course with too many routes`() {
        val hostPlayer = hostGame()

        val result = service.setCourse(gameCode, hostPlayer.id, course(routes = listOf("A", "B", "C", "D", "E")))

        assertThat(result, isFailure(InvalidCourseFailure("A course needs between 1 and 4 routes")))
    }

    @Test
    fun `cannot set a blank route name`() {
        val hostPlayer = hostGame()

        val result = service.setCourse(gameCode, hostPlayer.id, course(routes = listOf("  ")))

        assertThat(result, isFailure(InvalidCourseFailure("Route names must not be blank")))
    }

    @Test
    fun `cannot set duplicate route names`() {
        val hostPlayer = hostGame()
        val holes =
            (1..GameConstants.MAX_HOLES).map { hole ->
                // Same name in different cases still collides once trimmed and lowercased.
                CourseHole(Hole(hole), 2, mapOf("Ale Trail" to "Drink $hole", "ale trail " to "Drink $hole"))
            }

        val result = service.setCourse(gameCode, hostPlayer.id, holes)

        assertThat(result, isFailure(InvalidCourseFailure("Route names must be unique")))
    }

    @Test
    fun `cannot set a route name that is too long`() {
        val hostPlayer = hostGame()

        val result = service.setCourse(gameCode, hostPlayer.id, course(routes = listOf("R".repeat(41))))

        assertThat(result.failureOrNull() is InvalidCourseFailure, equalTo(true))
    }

    @Test
    fun `cannot set a hole that is missing a route`() {
        val hostPlayer = hostGame()
        val holes =
            course(routes = listOf("Ale Trail", "Spirit Run"))
                .map { if (it.hole == Hole(7)) it.copy(drinks = mapOf("Ale Trail" to "Guinness")) else it }

        val result = service.setCourse(gameCode, hostPlayer.id, holes)

        assertThat(result, isFailure(InvalidCourseFailure("Hole 7 must have a drink for every route")))
    }

    @Test
    fun `cannot set a blank drink`() {
        val hostPlayer = hostGame()
        val holes = course().map { if (it.hole == Hole(3)) it.copy(drinks = mapOf("Ale Trail" to " ")) else it }

        val result = service.setCourse(gameCode, hostPlayer.id, holes)

        assertThat(result, isFailure(InvalidCourseFailure("Drink for hole 3 on `Ale Trail` must not be blank")))
    }

    @Test
    fun `cannot set a drink that is too long`() {
        val hostPlayer = hostGame()
        val holes = course().map { if (it.hole == Hole(3)) it.copy(drinks = mapOf("Ale Trail" to "D".repeat(101))) else it }

        val result = service.setCourse(gameCode, hostPlayer.id, holes)

        assertThat(result.failureOrNull() is InvalidCourseFailure, equalTo(true))
    }

    @Test
    fun `cannot set drinks and pars for a game that doesn't exist`() {
        val result = service.setCourse(gameCode, PlayerId.random(), course())

        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }

    private fun hostGame(status: GameStatus = GameStatus.ACTIVE): Player {
        val hostPlayer = Player(PlayerId.random(), host)
        gameRepository.save(
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = status,
                hostPlayerId = hostPlayer.id,
            ),
        )
        return hostPlayer
    }

    private fun course(routes: List<String> = listOf("Ale Trail")): List<CourseHole> =
        (1..GameConstants.MAX_HOLES).map { hole ->
            CourseHole(Hole(hole), 2, routes.associateWith { "Drink $hole" })
        }

    @Test
    fun `gives up after repeated concurrent modification failures`() {
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(Player(PlayerId.random(), host)),
            )
        gameRepository.save(game)

        val staleService = GameService(FlakyGameRepository(gameRepository, failuresRemaining = Int.MAX_VALUE), eventPublisher)

        val result = staleService.joinGame(gameCode, PlayerName("Megan"))

        assertTrue(result.failureOrNull() is ConcurrentModificationFailure)
    }

    @Test
    fun `create game retries when the generated code already exists`() {
        val duplicateOnceRepository =
            object : GameRepository {
                var failuresRemaining = 1

                override fun save(game: Game): Result<Game, PubGolfFailure> =
                    if (failuresRemaining-- > 0) {
                        Failure(DuplicateGameCodeFailure("Game code `${game.code.value}` already exists."))
                    } else {
                        gameRepository.save(game)
                    }

                override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> = gameRepository.findByCodeIgnoreCase(code)
            }
        val flakyService = GameService(duplicateOnceRepository, eventPublisher)

        val result = flakyService.createGame(host)

        assertThat(result, isSuccess())
    }
}

private class FlakyGameRepository(
    private val delegate: GameRepositoryFake,
    private var failuresRemaining: Int,
) : GameRepository {
    override fun save(game: Game): Result<Game, PubGolfFailure> =
        if (failuresRemaining > 0) {
            failuresRemaining--
            Failure(ConcurrentModificationFailure("Game `${game.code.value}` was modified concurrently."))
        } else {
            delegate.save(game)
        }

    override fun findByCodeIgnoreCase(code: GameCode): Result<Game, PubGolfFailure> = delegate.findByCodeIgnoreCase(code)
}

fun Game.hasPlayer(name: String) = players.any { it.name.value == name }

private fun GameCode.isValidGameCode() = value.matches(Regex("[A-Za-z]+\\d{3}"))
