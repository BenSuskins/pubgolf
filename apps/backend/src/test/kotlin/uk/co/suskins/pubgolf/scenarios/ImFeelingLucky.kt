package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.matches
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.CONFLICT
import org.springframework.http.HttpStatus.OK
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClientException
import java.util.*
import kotlin.test.assertTrue

class ImFeelingLucky : ScenarioTest() {
    @Test
    fun `Can get wheel options`() {
        val response = wheelOptions()

        val body = response.bodyString().asJsonMap()
        val outcomes = body["options"] as List<String>
        assertThat(
            outcomes.size,
            equalTo(
                13
            )
        )
    }

    @Test
    fun `Can hit the I'm Feeling Lucky Button`() {
        val game = createGame("Ben")
        submitScore(game.gameCode(), game.playerId(), 1, 0)

        val response = imFeelingLucky(game.gameCode(), game.playerId())

        imFeelingLuckyValid(response)
    }

    @Test
    @Disabled
    fun `Can only hit the I'm Feeling Lucky Button once`() {
        val game = createGame("Jake")

        imFeelingLucky(game.gameCode(), game.playerId())
        val response = imFeelingLucky(game.gameCode(), game.playerId())

        assertThat(response.valueOrNull()!!.statusCode, equalTo(CONFLICT))
    }

    @Test
    fun `Can't use I'm Feeling Lucky Button for a game that doesn't exist`() {
        val response = submitScore("random-game-code", UUID.randomUUID().toString(), 1, 1)

        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` not found."))
    }

    @Test
    fun `Can't use I'm Feeling Lucky Button for a player that doesn't exist`() {
        val game = createGame("Ben")
        val playerId = UUID.randomUUID().toString()

        val response = submitScore(game.gameCode(), playerId, 1, 1)

        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Player `$playerId` not found for game `${game.gameCode()}`."))
    }

    private fun imFeelingLuckyValid(response: Result<ResponseEntity<String>, Exception>) {
        val body = response.bodyString().asJsonMap()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))

        assertThat(body["result"] as String, matches(resultPattern))
        assertThat(body["hole"], equalTo(2))
    }
}