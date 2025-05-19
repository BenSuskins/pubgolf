package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.isA
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.GameRepositoryFake
import uk.co.suskins.pubgolf.models.*
import uk.co.suskins.pubgolf.repository.GameRepository
import java.util.*
import kotlin.test.assertTrue

private const val gameCode = "ACE007"
private const val host = "Ben"

class GameServiceTest {
    private val gameRepository: GameRepository = GameRepositoryFake()
    private val service: GameService = GameService(gameRepository)

    @Test
    fun `can create game`() {
        val result = service.createGame(host)

        assertThat(result, isSuccess())
        val game = result.valueOrNull()!!
        assertThat(game.id, isA<UUID>())
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
        val game = Game(
            id = UUID.randomUUID(),
            code = gameCode,
            players = listOf(Player(UUID.randomUUID(), host))
        )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, "Megan")

        assertThat(result, isSuccess())
        val joinedGame = result.valueOrNull()!!
        assertTrue(joinedGame.hasPlayer("Megan"))

        val updatedGame = gameRepository.find(gameCode).valueOrNull()!!
        assertTrue(updatedGame.hasPlayer("Ben"))
        assertTrue(updatedGame.hasPlayer("Megan"))
        assertTrue(updatedGame.players.find { it.name == "Ben" }!!.hasInitialScore())
        assertTrue(updatedGame.players.find { it.name == "Megan" }!!.hasInitialScore())
    }

    @Test
    fun `fail to join a game that doesn't exist`() {
        val result = service.joinGame(gameCode, "Megan")

        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }

    @Test
    fun `fail to join a game with a name that already exists`() {
        val game = Game(
            id = UUID.randomUUID(),
            code = gameCode,
            players = listOf(Player(UUID.randomUUID(), host))
        )
        gameRepository.save(game)

        val result = service.joinGame(gameCode, host)

        assertThat(result, isFailure(PlayerAlreadyExistsFailure("Player `Ben` already exists for game `ACE007`.")))
    }

    @Test
    fun `can get the state of a game`() {
        val game = Game(
            id = UUID.randomUUID(),
            code = gameCode,
            players = listOf(Player(UUID.randomUUID(), host))
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
        val player = Player(UUID.randomUUID(), host)
        val game = Game(
            id = UUID.randomUUID(),
            code = gameCode,
            players = listOf(player)
        )
        gameRepository.save(game)

        val result = service.submitScore(gameCode, player.id, 2, 4)

        assertThat(result, isSuccess())

        val updatedGame = gameRepository.find(gameCode).valueOrNull()!!
        assertThat(
            updatedGame.players.find { it.name == host }!!.scores,
            equalTo(mapOf(1 to 0, 2 to 4, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0))
        )
    }

    @Test
    fun `fail to get submit a score for a game that doesn't exist`() {
        val result = service.submitScore(gameCode, UUID.randomUUID(), 2, 4)

        assertThat(result, isFailure(GameNotFoundFailure("Game `$gameCode` not found.")))
    }

    @Test
    fun `fail to get submit a score for a player that doesn't exist`() {
        val game = Game(
            id = UUID.randomUUID(),
            code = gameCode,
            players = listOf(Player(UUID.randomUUID(), host))
        )
        gameRepository.save(game)

        val playerId = UUID.randomUUID()
        val result = service.submitScore(gameCode, playerId, 2, 4)

        assertThat(result, isFailure(PlayerNotFoundFailure("Player `$playerId` not found for game `ACE007`.")))
    }
}

fun Game.hasPlayer(name: String) = players.any { it.name == name }
fun Player.hasInitialScore() = scores == (1..9).associateWith { 0 }
private fun String.isValidGameCode() = matches(Regex("[A-Za-z]+\\d{3}"))
