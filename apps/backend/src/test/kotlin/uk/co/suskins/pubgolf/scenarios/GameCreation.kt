package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClientException
import kotlin.test.assertTrue

class GameCreation : ScenarioTest() {
    @Test
    fun `Can successfully create a new game`() {
        val host = "Ben"

        val response = createGame(host)

        gameCreationSuccessful(response, host)
    }

    @Test
    fun `Can't create a game without a host`() {
        val response = createGame(null)

        gameCreationFailed(response)
    }

    private fun gameCreationSuccessful(response: Result<ResponseEntity<String>, Exception>, host: String) {
        assertTrue(response.valueOrNull()!!.statusCode.is2xxSuccessful)
        assertThat(
            response.valueOrNull()!!.body.asPrettyJson(), equalTo(
                """
                    {
                      "gameId": "game-abc123",
                      "gameCode": "ABC123",
                      "playerId": "player-xyz789",
                      "playerName": "$host"
                    }
                    """.trimMargin().asPrettyJson()
            )
        )
    }

    private fun gameCreationFailed(response: Result<ResponseEntity<String>, Exception>) {
        assertTrue((response.get() as RestClientException).message!!.contains("400 Bad Request"))
    }
}