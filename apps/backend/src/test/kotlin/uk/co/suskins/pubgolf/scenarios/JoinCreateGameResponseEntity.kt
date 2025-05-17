package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClientException
import kotlin.test.assertTrue

class JoinCreateGameResponseEntity : ScenarioTest() {
    @Test
    fun `Can successfully join a game`() {
        val game = createGame("Ben")
        val name = "Megan"
        val response = joinGame(game.gameCode(), name)

        joinedGameSuccessfully(response, name)
    }

    @Test
    fun `Can't join a game that doesn't exist`() {
        val response = joinGame("random-game-code", "Megan")

        joinedGameFails(response)
    }

    private fun joinedGameSuccessfully(response: Result<ResponseEntity<String>, Exception>, name: String) {
        assertThat(response.valueOrNull()!!.statusCode, equalTo(HttpStatus.OK))
        assertThat(
            response.valueOrNull()!!.body.asPrettyJson(), equalTo(
                """
                   {
                      "gameId": "game-abc123",
                      "gameCode": "ABC123",
                      "playerId": "player-xyz789",
                      "playerName": "$name"
                    }
                    """.trimMargin().asPrettyJson()
            )
        )
    }

    private fun joinedGameFails(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` could not be found."))
    }
}
