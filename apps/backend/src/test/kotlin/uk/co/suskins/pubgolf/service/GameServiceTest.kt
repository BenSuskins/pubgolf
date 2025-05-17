package uk.co.suskins.pubgolf.service

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.hamkrest.isSuccess
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uk.co.suskins.pubgolf.GameRepositoryFake

class GameServiceTest {
    private val gameRepository: GameRepository = GameRepositoryFake()
    private val service: GameService = GameService(gameRepository)

    @Test
    fun `can create game and return host`() {
        val result = service.createGame("Ben")

        assertThat(result, isSuccess())
        val game = result.valueOrNull()!!
        assertThat(game.playerName, equalTo("Ben"))
        assertTrue(game.gameCode.matches(Regex("[A-Z]+\\d{3}")))
    }
}

