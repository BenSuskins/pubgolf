package uk.co.suskins.pubgolf.models

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.isIn
import org.junit.jupiter.api.Test

class OutcomesTest {
    @Test
    fun `random always returns a valid outcome`() {
        repeat(100) {
            val result = Outcomes.random()
            assertThat(result, isIn(Outcomes.entries))
        }
    }
}
