package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class SubmitScore : ScenarioTest() {
    @Test
    fun `Can successfully submit a score`() {
        val game = createGame("Ben")

        val response = submitScore(game.gameCode(), game.playerId(), 0, 1)

        scoreSubmittedSuccessfully(response)
    }

    private fun scoreSubmittedSuccessfully(response: Result<ResponseEntity<String>, Exception>) {
        assertThat(response.valueOrNull()!!.statusCode, equalTo(HttpStatus.NO_CONTENT))
    }
}
