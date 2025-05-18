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

class GameState : ScenarioTest() {
    @Test
    fun `Can successfully get the current game state`() {
        val host = "Ben"
        val game = createGame(host)
        for (i in 1..10) {
            joinGame(game.gameCode(), "Ben$i")
        }

        val response = gameState(game.gameCode())

        gameStateValid(response, host)
    }

    @Test
    fun `Can't get game state for a game that doesn't exist`() {
        val response = gameState("random-game-code")

        gameStateFails(response)
    }

    private fun gameStateValid(response: Result<ResponseEntity<String>, Exception>, host: String) {
        val body = response.valueOrNull()!!.body!!.asJsonMap()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))

        assertThat(body["gameId"] as String, matches(uuidPattern))
        assertThat(body["gameCode"] as String, matches(gameCodePattern))

        val players = body["players"] as List<*>
        assertThat(players.size, equalTo(11))

        val player = players[0] as Map<*, *>
        assertThat(player["id"] as String, matches(uuidPattern))
        assertThat(player["name"], equalTo(host))
        assertThat(player["scores"], equalTo(List(9) { 0 }))
    }


    private fun gameStateFails(response: Result<ResponseEntity<String>, Exception>) {
        val restClientException = response.get() as RestClientException
        assertTrue(restClientException.message!!.contains("404 Not Found"))
        assertTrue(restClientException.message!!.contains("Game `random-game-code` not found."))
    }
}