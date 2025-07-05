package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.OK
import org.springframework.http.ResponseEntity

class ImFeelingLucky : ScenarioTest() {

    @Test
    fun `Can hit the I'm Feeling Lucky Button`() {
        val game = createGame("Ben")

        val response = imFeelingLucky(game.gameCode(), game.playerId())

        imFeelingLuckyValid(response)
    }

    private fun imFeelingLuckyValid(response: Result<ResponseEntity<String>, Exception>) {
        val body = response.bodyString().asJsonMap()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))

        assertThat(body["result"], equalTo("Hole 4 - Double Drink"))

        val outcomes = body["outcomes"] as List<*>
        assertThat(outcomes.size, equalTo(13)) // 9 Drinks, Double Drink, Half Score, Double Score, Free Choice
    }
}