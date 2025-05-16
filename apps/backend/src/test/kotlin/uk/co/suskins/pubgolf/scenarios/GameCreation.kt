package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
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
        val host = null

        val gameResponse = createGame(host)

        gameFailedToCreate(gameResponse)
    }

    private fun gameCreatedForHost(gameResponse: ResponseEntity<String>, host: String) {
        assertTrue(gameResponse.statusCode.is2xxSuccessful)
        assertThat(
            gameResponse.body.asPrettyJson(), equalTo(
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

    private fun gameFailedToCreate(gameResponse: ResponseEntity<String>) {
        assertTrue(gameResponse.statusCode.is4xxClientError)
        assertThat(
            gameResponse.body.asPrettyJson(), equalTo(
                """
                    {
                      "error": "Failed to create a game without a host"
                    """.trimMargin().asPrettyJson()
            )
        )
    }
}