package uk.co.suskins.pubgolf.scenarios

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus.OK
import kotlin.test.assertNotNull

class RandomiseOptions : ScenarioTest() {
    @Test
    fun `Returns 200 OK with randomise options`() {
        val response = randomiseOptions()

        assertThat(response.valueOrNull()!!.statusCode, equalTo(OK))
    }

    @Test
    fun `Contains all 13 outcomes`() {
        val response = randomiseOptions()

        val body = response.bodyString().asJsonMap()
        val options = body["options"] as List<*>
        assertThat(options.size, equalTo(13))
    }

    @Test
    fun `Each outcome has label and weight`() {
        val response = randomiseOptions()

        val body = response.bodyString().asJsonMap()
        val options = body["options"] as List<*>

        options.forEach { option ->
            val optionMap = option as Map<*, *>
            assertNotNull(optionMap["option"], "option label should not be null")
            assertNotNull(optionMap["optionSize"], "optionSize (weight) should not be null")
        }
    }

    @Test
    fun `Outcomes include expected drink options`() {
        val response = randomiseOptions()

        val body = response.bodyString().asJsonMap()
        val options = body["options"] as List<*>
        val labels = options.map { (it as Map<*, *>)["option"] as String }

        val expectedLabels =
            listOf(
                "Double Drink",
                "Half Score",
                "Double Score",
                "Free Choice",
                "Tequila",
                "Beer",
                "Wine",
                "Cider",
                "Cocktail",
                "Spirit w/ Mixer",
                "Guinness",
                "Jägerbomb",
                "VK",
            )

        expectedLabels.forEach { expected ->
            assert(labels.contains(expected)) { "Expected outcome '$expected' not found in $labels" }
        }
    }
}
