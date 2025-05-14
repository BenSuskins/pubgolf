package uk.co.suskins.pubgolf.scenarios

import org.junit.jupiter.api.Test
import kotlin.test.assertTrue

class GameCreation : ScenarioTest() {
    @Test
    fun `Can create a new game`() {
        val gameResponse = createGame()

        assertTrue(gameResponse.statusCode.is2xxSuccessful)
    }
}