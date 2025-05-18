package uk.co.suskins.pubgolf.repository

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.valueOrNull
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.ActiveProfiles
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.Player
import java.util.*
import kotlin.test.BeforeTest
import kotlin.test.Test

@DataJpaTest
@ActiveProfiles("test")
class GameRepositoryAdapterTest {

    @Autowired
    lateinit var store: GameJpaRepository

    private lateinit var adapter: GameRepository

    @BeforeTest
    fun setup() {
        adapter = GameRepositoryAdapter(store)
    }

    @Test
    fun `can save and find a game with players`() {
        val game = Game(
            id = UUID.randomUUID(),
            code = "ACE007",
            players = listOf(
                Player(UUID.randomUUID(), "Ben")
            )
        )

        val saved = adapter.save(game).valueOrNull()!!
        val found = adapter.find("ACE007").valueOrNull()!!

        assertThat(found.id, equalTo(saved.id))
        assertThat(found.players.size, equalTo(1))
        assertThat(found.players.first().name, equalTo("Ben"))
    }

    @Test
    fun `returns failure if game code not found`() {
        val result = adapter.find("ACE007")
        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }
}