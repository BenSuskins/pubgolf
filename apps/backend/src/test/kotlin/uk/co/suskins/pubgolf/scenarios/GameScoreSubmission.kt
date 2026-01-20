package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.NO_CONTENT
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClientException
import java.util.UUID
import kotlin.test.assertTrue

class GameScoreSubmission : ScenarioTest() {
    @Test
    fun `Can successfully submit a score`() {
        val game = createGame("Ben")

        val response = submitScore(game.gameCode(), game.playerId(), 1, 1)

        scoreSubmittedSuccessfully(response)
    }

    @Test
    fun `Can't submit a score outside of the input validations`() {
        val game = createGame("Ben")

        scoreSubmittedFailed(submitScore(game.gameCode(), game.playerId(), 0, 1))
        scoreSubmittedFailed(submitScore(game.gameCode(), game.playerId(), 10, 1))
        scoreSubmittedFailed(submitScore(game.gameCode(), game.playerId(), 1, -11))
        scoreSubmittedFailed(submitScore(game.gameCode(), game.playerId(), 1, 11))
    }

    @Test
    fun `Can't submit a score for a game that doesn't exist`() {
        val response = submitScore("random-game-code", UUID.randomUUID().toString(), 1, 1)

        submitScoreGameDoesNotExist(response)
    }

    @Test
    fun `Can't submit a score for a player that doesn't exist`() {
        val game = createGame("Ben")
        val playerId = UUID.randomUUID().toString()

        val response = submitScore(game.gameCode(), playerId, 1, 1)

        submitScorePlayerDoesNotExist(response, playerId, game.gameCode())
    }

    private fun scoreSubmittedSuccessfully(response: Result<ResponseEntity<String>, Exception>) {
        assertThat(response.valueOrNull()!!.statusCode, equalTo(NO_CONTENT))
    }

    private fun submitScoreGameDoesNotExist(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` not found."))
    }

    private fun submitScorePlayerDoesNotExist(
        response: Result<ResponseEntity<String>, Exception>,
        playerId: String,
        gameCode: String,
    ) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("403 Forbidden"))
        assertTrue(restClientException.message!!.contains("does not belong to game"))
    }

    private fun scoreSubmittedFailed(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("400 Bad Request"))
    }
}
