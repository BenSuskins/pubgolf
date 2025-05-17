package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.contains
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.GameRepositoryFake

class GameServiceTest {
    private val gameRepository: GameRepository = GameRepositoryFake()
    private val service: GameService = GameService(gameRepository)

    @Test
    fun `can create game`() {
        val result = service.createGame("Ben")

        assertThat(result, isSuccess())
        val game = result.valueOrNull()!!
        assertThat(
            game.id.toString(),
            contains(Regex("[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}"))
        )
        assertThat(game.code, contains(Regex("[A-Z]+\\d{3}")))
    }

    @Test
    fun `can create game with a host`() {
        val result = service.createGame("Ben")

        val game = result.valueOrNull()!!
        val host = game.players.first()

        assertThat(game.players.size, equalTo(1))
        assertThat(host.name, equalTo("Ben"))
        assertThat(
            host.scores,
            equalTo((0..8).associateWith { 0 })
        )
    }
}

