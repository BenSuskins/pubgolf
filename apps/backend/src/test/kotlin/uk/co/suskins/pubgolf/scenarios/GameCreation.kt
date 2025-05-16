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

        val gameResponse = createGame(host)

        gameCreatedForHost(gameResponse, host)
    }

    @Test
    fun `Can't create a game without a host`() {
        val gameResponse = createGame(null)

        gameFailedToCreate(gameResponse)
    }

    private fun gameCreatedForHost(gameResponse: Result<ResponseEntity<String>, Exception>, host: String) {
        val response = gameResponse.valueOrNull()
        assertTrue(response!!.statusCode.is2xxSuccessful)
        assertThat(
            response.body.asPrettyJson(), equalTo(
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

    private fun gameFailedToCreate(gameResponse: Result<ResponseEntity<String>, Exception>) {
        val response = gameResponse.get() as RestClientException
        assertTrue(response.message!!.contains("400 Bad Request"))
    }
}