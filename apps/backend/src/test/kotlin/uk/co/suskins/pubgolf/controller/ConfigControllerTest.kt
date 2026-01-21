package uk.co.suskins.pubgolf.controller

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import uk.co.suskins.pubgolf.models.OutcomesResponse
import uk.co.suskins.pubgolf.models.PenaltyOptionsResponse
import uk.co.suskins.pubgolf.models.RoutesResponse

class ConfigControllerTest {
    private val controller = ConfigController()

    @Test
    fun `returns 200 OK with randomise options`() {
        val response = controller.randomiseOptions()

        assertThat(response.statusCode, equalTo(HttpStatus.OK))
        assertThat(response.body is OutcomesResponse, equalTo(true))
    }

    @Test
    fun `returns 200 OK with penalty options`() {
        val response = controller.penaltyOptions()

        assertThat(response.statusCode, equalTo(HttpStatus.OK))
        assertThat(response.body is PenaltyOptionsResponse, equalTo(true))
    }

    @Test
    fun `returns 200 OK with routes`() {
        val response = controller.routes()

        assertThat(response.statusCode, equalTo(HttpStatus.OK))
        assertThat(response.body is RoutesResponse, equalTo(true))
    }
}
