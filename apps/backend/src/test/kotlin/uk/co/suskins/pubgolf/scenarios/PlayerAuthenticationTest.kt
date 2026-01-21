package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.get
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestClientException
import java.util.UUID

class PlayerAuthenticationTest : ScenarioTest() {
    @Test
    fun `submitScore without header returns 401`() {
        val game = createGame("Ben")

        val result: Result<ResponseEntity<String>, Exception> = submitScore(game.gameCode(), null, 1, 1)

        assertAuthenticationFailure(result, "401", "Missing required header")
    }

    @Test
    fun `submitScore with invalid UUID format returns 401`() {
        val game = createGame("Ben")

        val result = submitScore(game.gameCode(), "invalid-uuid", 1, 1)

        assertAuthenticationFailure(result, "401", "Invalid player ID format")
    }

    @Test
    fun `submitScore with player not in game returns 403`() {
        val game = createGame("Ben")
        val otherPlayerId = UUID.randomUUID().toString()

        val result = submitScore(game.gameCode(), otherPlayerId, 1, 1)

        assertAuthenticationFailure(result, "403", "does not belong to game")
    }

    @Test
    fun `randomise without header returns 401`() {
        val game = createGame("Ben")

        val result = randomise(game.gameCode(), null)

        assertAuthenticationFailure(result, "401")
    }

    private fun assertAuthenticationFailure(
        result: Result<ResponseEntity<String>, Exception>,
        statusCode: String,
        messageFragment: String? = null,
    ) {
        val exception = result.get() as RestClientException
        assertThat(exception.message!!.contains(statusCode), equalTo(true))
        if (messageFragment != null) {
            assertThat(exception.message!!.contains(messageFragment), equalTo(true))
        }
    }
}
