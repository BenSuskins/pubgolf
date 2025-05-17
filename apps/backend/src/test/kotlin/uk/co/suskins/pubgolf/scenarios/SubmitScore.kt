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

class SubmitScore : ScenarioTest() {
    @Test
    fun `Can successfully submit a score`() {
        val game = createGame("Ben")

        val response = submitScore(game.gameCode(), game.playerId(), 0, 1)

        scoreSubmittedSuccessfully(response)
    }

    @Test
    fun `Can't submit a score for a game that doesn't exist`() {
        val response = submitScore("random-game-code", "random-player-id", 0, 1)

        submitScoreGameDoesNotExist(response)
    }

    @Test
    fun `Can't submit a score for a player that doesn't exist`() {
        val game = createGame("Ben")

        val response = submitScore(game.gameCode(), "random-player-id", 0, 1)

        submitScorePlayerDoesNotExist(response)
    }

    private fun scoreSubmittedSuccessfully(response: Result<ResponseEntity<String>, Exception>) {
        assertThat(response.valueOrNull()!!.statusCode, equalTo(HttpStatus.NO_CONTENT))
    }

    private fun submitScoreGameDoesNotExist(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` could not be found."))
    }

    private fun submitScorePlayerDoesNotExist(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Player `random-player-id` could not be found for game `ABC123`."))
    }
}
