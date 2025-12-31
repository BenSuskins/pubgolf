package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.valueOrNull
import org.json.JSONObject
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.OK

class Routes : ScenarioTest() {
    @Test
    fun `Routes endpoint returns all 9 holes with drinks and par`() {
        val response = routes()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))

        val body = JSONObject(response.bodyString())
        val holes = body.getJSONArray("holes")
        assertThat(holes.length(), equalTo(9))

        val firstHole = holes.getJSONObject(0)
        assertThat(firstHole.getInt("hole"), equalTo(1))
        assertThat(firstHole.getInt("par"), equalTo(1))

        val drinks = firstHole.getJSONObject("drinks")
        assertThat(drinks.getString("Route A"), equalTo("Tequila"))
        assertThat(drinks.getString("Route B"), equalTo("Sambuca"))
    }

    @Test
    fun `Routes endpoint returns consistent route names across all holes`() {
        val response = routes()
        val body = JSONObject(response.bodyString())
        val holes = body.getJSONArray("holes")

        val routeNames =
            holes
                .getJSONObject(0)
                .getJSONObject("drinks")
                .keys()
                .asSequence()
                .toSet()

        for (i in 0 until holes.length()) {
            val holeRoutes =
                holes
                    .getJSONObject(i)
                    .getJSONObject("drinks")
                    .keys()
                    .asSequence()
                    .toSet()
            assertThat(holeRoutes, equalTo(routeNames))
        }
    }

    @Test
    fun `Routes endpoint returns correct pars for all holes`() {
        val response = routes()
        val body = JSONObject(response.bodyString())
        val holes = body.getJSONArray("holes")

        val expectedPars = listOf(1, 3, 2, 2, 2, 2, 4, 1, 1)

        for (i in 0 until holes.length()) {
            val hole = holes.getJSONObject(i)
            assertThat(hole.getInt("hole"), equalTo(i + 1))
            assertThat(hole.getInt("par"), equalTo(expectedPars[i]))
        }
    }
}
