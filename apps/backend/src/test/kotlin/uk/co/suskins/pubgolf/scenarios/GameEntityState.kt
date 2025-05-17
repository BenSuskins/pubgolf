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

class GameEntityState : ScenarioTest() {
    @Test
    fun `Can successfully get the current game state`() {
        val game = createGame("Ben")

        val response = gameState(game.gameCode())

        gameStateValid(response)
    }

    @Test
    fun `Can't get game state for a game that doesn't exist`() {
        val response = gameState("random-game-code")

        gameStateFails(response)
    }

    private fun gameStateValid(response: Result<ResponseEntity<String>, Exception>) {
        assertThat(response.valueOrNull()!!.statusCode, equalTo(HttpStatus.OK))
        assertThat(
            response.valueOrNull()!!.body.asPrettyJson(), equalTo(
                """
                        {
                          "gameId": "game-abc123",
                          "gameCode": "ABC123",
                          "players": [
                            {
                              "id": "player-xyz789",
                              "name": "Player",
                              "scores": [0, 0, 0, 0, 0, 0, 0, 0, 0]
                            }
                          ]
                        }
                    """.trimMargin().asPrettyJson()
            )
        )
    }


    private fun gameStateFails(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` could not be found."))
    }
}