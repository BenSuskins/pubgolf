package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.contains
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.isA
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.GameRepositoryFake
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.Player
import java.util.*

class GameServiceTest {
    private val gameRepository: GameRepository = GameRepositoryFake()
    private val service: GameService = GameService(gameRepository)

    @Test
    fun `can create game`() {
        val result = service.createGame("Ben")

        assertThat(result, isSuccess())
        val game = result.valueOrNull()!!
        assertThat(game.id, isA<UUID>())
        assertThat(game.code, contains(Regex("[A-Z]+\\d{3}")))
    }

    @Test
    fun `can create game with a host`() {
        val result = service.createGame("Ben")

        val game = result.valueOrNull()!!
        val host = game.players.first()

        assertThat(game.players.size, equalTo(1))
        assertThat(host.name, equalTo("Ben"))
        assertThat(host.scores, equalTo((0..8).associateWith { 0 }))
    }

    @Test
    fun `can join a game`() {
        val game = Game(
            id = UUID.randomUUID(),
            code = "ACE007",
            players = listOf(Player(UUID.randomUUID(), "Ben"))
        )
        gameRepository.save(game)

        val result = service.joinGame("ACE007", "Megan")

        assertThat(result, isSuccess())
        val joinedGame = result.valueOrNull()!!
        assertThat(joinedGame.players.map { it.name }, equalTo(listOf("Ben", "Megan")))

        val updatedGame = gameRepository.find("ACE007").valueOrNull()!!
        assertThat(updatedGame.players.map { it.name }, equalTo(listOf("Ben", "Megan")))
    }
}

