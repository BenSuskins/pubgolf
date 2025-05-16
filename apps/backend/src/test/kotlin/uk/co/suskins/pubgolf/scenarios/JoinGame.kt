package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import kotlin.test.assertTrue

class JoinGame : ScenarioTest() {
    @Test
    fun `Can successfully join a game`() {
        val gameResponse = createGame("Ben")
        val response = joinGame(gameResponse.joinCode(), "Megan")

        joinedGameSuccessfully(response)
    }

    private fun joinedGameSuccessfully(response: Result<ResponseEntity<String>, Exception>) {
        assertTrue(response.valueOrNull()!!.statusCode.is2xxSuccessful)
        assertThat(
            response.valueOrNull()!!.body.asPrettyJson(), equalTo(
                """
                    {
                      "gameId": "game-abc123",
                      "playerId": "player-xyz789"
                    }
                    """.trimMargin().asPrettyJson()
            )
        )
    }
}
