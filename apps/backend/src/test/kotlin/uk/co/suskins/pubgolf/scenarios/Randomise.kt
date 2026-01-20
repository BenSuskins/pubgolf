package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.matches
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.OK
import org.springframework.web.client.RestClientException
import java.util.UUID
import kotlin.test.assertTrue

class Randomise : ScenarioTest() {
    @Test
    fun `Can use the randomise button`() {
        val game = createGame("Ben")
        submitScore(game.gameCode(), game.playerId(), 5, 0)

        val response = randomise(game.gameCode(), game.playerId())

        val body = response.bodyString().asJsonMap()
        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))
        assertThat(body["result"] as String, matches(resultPattern))
        assertThat(body["hole"], equalTo(6))
    }

    @Test
    fun `Can only use the randomise button once`() {
        val game = createGame("Jake")

        randomise(game.gameCode(), game.playerId())
        val response = randomise(game.gameCode(), game.playerId())

        val restClientException = response.get() as RestClientException
        println(restClientException)
        assertTrue(restClientException.message!!.contains("409 Conflict"))
        assertTrue(restClientException.message!!.contains("Randomise already used"))
    }

    @Test
    fun `Can't use the randomise button when your last hole was 9`() {
        val game = createGame("Jake")
        submitScore(game.gameCode(), game.playerId(), 9, 2)

        randomise(game.gameCode(), game.playerId())
        val response = randomise(game.gameCode(), game.playerId())

        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("409 Conflict"))
        assertTrue(restClientException.message!!.contains("No more holes left"))
    }

    @Test
    fun `Can't use randomise button for a game that doesn't exist`() {
        val response = submitScore("random-game-code", UUID.randomUUID().toString(), 1, 1)

        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` not found."))
    }

    @Test
    fun `Can't use randomise button for a player that doesn't exist`() {
        val game = createGame("Ben")
        val playerId = UUID.randomUUID().toString()

        val response = submitScore(game.gameCode(), playerId, 1, 1)

        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("403 Forbidden"))
        assertTrue(restClientException.message!!.contains("Player `$playerId` does not belong to game `${game.gameCode()}`."))
    }
}
