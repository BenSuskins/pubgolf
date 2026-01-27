package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.isA
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.models.ActiveEvent
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameEvent
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.repository.GameRepositoryFake
import java.time.Instant
import java.util.UUID
import kotlin.test.assertTrue

private val gameCode = GameCode("ACE007")
private val host = PlayerName("Ben")

class GameServiceTest {
    private val gameRepository = GameRepositoryFake()
    private val gameMetrics = GameMetrics(SimpleMeterRegistry())
    private val gameStateBroadcaster = GameStateBroadcasterFake()
    private val service = GameService(gameRepository, gameMetrics, gameStateBroadcaster)

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
        assertTrue(hostPlayer.hasInitialScore())
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
        val joinedGame = result.valueOrNull()!!
        assertTrue(joinedGame.hasPlayer("Megan"))

        val updatedGame = gameRepository.findByCodeIgnoreCase(gameCode).valueOrNull()!!
        assertTrue(updatedGame.hasPlayer("Ben"))
        assertTrue(updatedGame.hasPlayer("Megan"))
        assertTrue(updatedGame.players.find { it.name.value == "Ben" }!!.hasInitialScore())
        assertTrue(updatedGame.players.find { it.name.value == "Megan" }!!.hasInitialScore())
    }

    @Test
    fun `fail to join a game that doesn't exist`() {
        val result = service.joinGame(gameCode, PlayerName("Megan"))

        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
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
                    Hole(1) to Score(0),
                    Hole(2) to Score(4),
                    Hole(3) to Score(0),
                    Hole(4) to Score(0),
                    Hole(5) to Score(0),
                    Hole(6) to Score(0),
                    Hole(7) to Score(0),
                    Hole(8) to Score(0),
                    Hole(9) to Score(0),
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
    fun `fail to use randomise when most recent score is hole 9`() {
        val player = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(player),
            )
        gameRepository.save(game)
        service.submitScore(gameCode, player.id, Hole(9), Score(5))

        val result = service.randomise(gameCode, player.id)

        assertThat(result, isFailure(RandomiseAlreadyUsedFailure("No more holes left")))
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

        assertThat(result, isFailure(NotHostPlayerFailure("Only the host can complete this game")))
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
                activeEvent = ActiveEvent(GameEvent.PHOTO_OP, Instant.now()),
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
    fun `host can end active event`() {
        val hostPlayer = Player(PlayerId.random(), host)
        val game =
            Game(
                id = GameId.random(),
                code = gameCode,
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
                activeEvent = ActiveEvent(GameEvent.PHOTO_OP, Instant.now()),
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
                activeEvent = ActiveEvent(GameEvent.PHOTO_OP, Instant.now()),
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
        val activeEvent = ActiveEvent(GameEvent.PHOTO_OP, Instant.now())
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
}

fun Game.hasPlayer(name: String) = players.any { it.name.value == name }

fun Player.hasInitialScore() =
    scores.mapValues { it.value.score } ==
        (1..9)
            .associateWith { 0 }
            .mapKeys { Hole(it.key) }
            .mapValues { (Score(it.value)) }

private fun GameCode.isValidGameCode() = value.matches(Regex("[A-Za-z]+\\d{3}"))
