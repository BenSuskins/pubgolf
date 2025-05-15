package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import org.junit.jupiter.api.Test
import kotlin.test.assertTrue

class GameCreation : ScenarioTest() {
    @Test
    fun `Can create a new game`() {
        val gameResponse = createGame()

        assertTrue(gameResponse.statusCode.is2xxSuccessful)
        assertThat(
            gameResponse.body.asPrettyJson(), equalTo(
                """
                { 
                "identifier": "an identifier"
                }
                """
                    .trimMargin().asPrettyJson()
            )
        )
    }
}