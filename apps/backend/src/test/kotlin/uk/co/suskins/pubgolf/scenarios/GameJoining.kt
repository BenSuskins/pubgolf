package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import com.natpryce.hamkrest.matches
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.get
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.OK
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClientException
import kotlin.test.assertTrue

class GameJoining : ScenarioTest() {
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

    @Test
    fun `Can't join a game with the same name as another playe`() {
        val name = "Ben"
        val game = createGame(name)

        val response = joinGame(game.gameCode(), name)

        joinedGameFailsSameName(response, name, game.gameCode())
    }

    private fun joinedGameSuccessfully(response: Result<ResponseEntity<String>, Exception>, name: String) {
        val body = response.valueOrNull()!!.body!!.asJsonMap()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))

        assertThat(body["playerName"], equalTo(name))
        assertThat(body["gameCode"] as String, matches(gameCodePattern))
        assertThat(body["gameId"] as String, matches(uuidPattern))
        assertThat(body["playerId"] as String, matches(uuidPattern))
    }

    private fun joinedGameFails(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` not found."))
    }

    private fun joinedGameFailsSameName(
        response: Result<ResponseEntity<String>, Exception>,
        name: String,
        gameCode: String
    ) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("400 Bad Request"))
        assertTrue(restClientException.message!!.contains("Player `$name` already exists for game `$gameCode`."))
    }
}
