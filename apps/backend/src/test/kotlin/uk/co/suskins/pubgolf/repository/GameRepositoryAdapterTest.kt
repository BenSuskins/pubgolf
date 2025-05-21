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
import uk.co.suskins.pubgolf.service.hasInitialScore
import uk.co.suskins.pubgolf.service.hasPlayer
import java.util.*
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertTrue

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
        validate(saved, game)

        val found = adapter.findByCodeIgnoreCase("ACE007").valueOrNull()!!
        validate(found, game)
    }

    private fun validate(persistedGame: Game, originalGame: Game) {
        assertThat(persistedGame, equalTo(originalGame))
        assertThat(persistedGame.id, equalTo(originalGame.id))
        assertThat(persistedGame.players.size, equalTo(1))
        assertTrue(persistedGame.hasPlayer("Ben"))
        assertTrue(persistedGame.players.find { it.name == "Ben" }!!.hasInitialScore())
    }

    @Test
    fun `returns failure if game code not found`() {
        val result = adapter.findByCodeIgnoreCase("ACE007")
        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }
}