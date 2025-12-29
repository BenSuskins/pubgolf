package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.valueOrNull
import org.json.JSONObject
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.NO_CONTENT
import org.springframework.http.HttpStatus.OK

class Penalties : ScenarioTest() {
    @Test
    fun `Can submit a score with SKIP penalty`() {
        val game = createGame("Ben")

        val response = submitScore(game.gameCode(), game.playerId(), 3, 0, "SKIP")

        assertThat(response.valueOrNull()!!.statusCode, equalTo(NO_CONTENT))

        val state = gameState(game.gameCode())
        val players = JSONObject(state.bodyString()).getJSONArray("players")
        val player = players.getJSONObject(0)
        val penalties = player.getJSONArray("penalties")
        assertThat(penalties.length(), equalTo(1))
        val penalty = penalties.getJSONObject(0)
        assertThat(penalty.getInt("hole"), equalTo(3))
        assertThat(penalty.getString("type"), equalTo("SKIP"))
        assertThat(penalty.getInt("points"), equalTo(5))

        val scores = player.getJSONArray("scores")
        assertThat(scores.getInt(2), equalTo(5))
    }

    @Test
    fun `Can submit a score with CHUNDER penalty`() {
        val game = createGame("Ben")

        val response = submitScore(game.gameCode(), game.playerId(), 5, 0, "CHUNDER")

        assertThat(response.valueOrNull()!!.statusCode, equalTo(NO_CONTENT))

        val state = gameState(game.gameCode())
        val players = JSONObject(state.bodyString()).getJSONArray("players")
        val player = players.getJSONObject(0)
        val penalties = player.getJSONArray("penalties")
        assertThat(penalties.length(), equalTo(1))
        val penalty = penalties.getJSONObject(0)
        assertThat(penalty.getInt("hole"), equalTo(5))
        assertThat(penalty.getString("type"), equalTo("CHUNDER"))
        assertThat(penalty.getInt("points"), equalTo(10))

        val scores = player.getJSONArray("scores")
        assertThat(scores.getInt(4), equalTo(10))
    }

    @Test
    fun `Can clear penalty by resubmitting without penaltyType`() {
        val game = createGame("Ben")

        submitScore(game.gameCode(), game.playerId(), 3, 0, "SKIP")

        var state = gameState(game.gameCode())
        var player = JSONObject(state.bodyString()).getJSONArray("players").getJSONObject(0)
        assertThat(player.getJSONArray("penalties").length(), equalTo(1))

        submitScore(game.gameCode(), game.playerId(), 3, 2)

        state = gameState(game.gameCode())
        player = JSONObject(state.bodyString()).getJSONArray("players").getJSONObject(0)
        assertThat(player.getJSONArray("penalties").length(), equalTo(0))
        assertThat(player.getJSONArray("scores").getInt(2), equalTo(2))
    }

    @Test
    fun `Penalty options endpoint returns correct data`() {
        val response = penaltyOptions()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))

        val body = JSONObject(response.bodyString())
        val penalties = body.getJSONArray("penalties")
        assertThat(penalties.length(), equalTo(2))

        val skip = penalties.getJSONObject(0)
        assertThat(skip.getString("type"), equalTo("SKIP"))
        assertThat(skip.getString("name"), equalTo("Skip a drink"))
        assertThat(skip.getInt("points"), equalTo(5))

        val chunder = penalties.getJSONObject(1)
        assertThat(chunder.getString("type"), equalTo("CHUNDER"))
        assertThat(chunder.getString("name"), equalTo("Tactical chunder"))
        assertThat(chunder.getInt("points"), equalTo(10))
    }

    @Test
    fun `Can have multiple penalties on different holes`() {
        val game = createGame("Ben")

        submitScore(game.gameCode(), game.playerId(), 1, 0, "SKIP")
        submitScore(game.gameCode(), game.playerId(), 5, 0, "CHUNDER")

        val state = gameState(game.gameCode())
        val player = JSONObject(state.bodyString()).getJSONArray("players").getJSONObject(0)
        val penalties = player.getJSONArray("penalties")
        assertThat(penalties.length(), equalTo(2))
    }
}
