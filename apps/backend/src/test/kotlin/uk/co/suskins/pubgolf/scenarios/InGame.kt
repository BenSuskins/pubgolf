package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class InGame : ScenarioTest() {
    @Test
    fun `Can successfully get the current game state`() {
        val game = createGame("Ben")

        val response = gameState(game.gameCode())

        gameCreationSuccessful(response, "Ben")
    }

    private fun gameCreationSuccessful(response: Result<ResponseEntity<String>, Exception>, host: String) {
        assertThat(response.valueOrNull()!!.statusCode, equalTo(HttpStatus.CREATED))
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

}