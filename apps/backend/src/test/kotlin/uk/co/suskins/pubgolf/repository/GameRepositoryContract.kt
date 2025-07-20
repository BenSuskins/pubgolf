package uk.co.suskins.pubgolf.repository

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Tag
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.ActiveProfiles
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.service.hasInitialScore
import uk.co.suskins.pubgolf.service.hasPlayer
import kotlin.test.Test
import kotlin.test.assertTrue

interface GameRepositoryContract {
    val gameRepository: GameRepository

    @Test
    fun `can save and find a game with players`() {
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players =
                    listOf(
                        Player(PlayerId.random(), PlayerName("Ben")),
                    ),
            )

        val saved = gameRepository.save(game).valueOrNull()!!
        validate(saved, game)

        val found = gameRepository.findByCodeIgnoreCase(GameCode("ACE007")).valueOrNull()!!
        validate(found, game)
    }

    private fun validate(
        persistedGame: Game,
        originalGame: Game,
    ) {
        assertThat(persistedGame, equalTo(originalGame))
        assertThat(persistedGame.id, equalTo(originalGame.id))
        assertThat(persistedGame.players.size, equalTo(1))
        assertTrue(persistedGame.hasPlayer("Ben"))
        assertTrue(persistedGame.players.find { it.name.value == "Ben" }!!.hasInitialScore())
    }

    @Test
    fun `returns failure if game code not found`() {
        val result = gameRepository.findByCodeIgnoreCase(GameCode("ACE007"))
        assertThat(result, isFailure(GameNotFoundFailure("Game `ACE007` not found.")))
    }
}

@DataJpaTest
@ActiveProfiles("test")
@Tag("integration")
class GameRepositoryAdapterTest : GameRepositoryContract {
    @Autowired
    lateinit var store: GameJpaRepository
    override val gameRepository: GameRepository
        get() {
            return GameRepositoryAdapter(store)
        }
}

class GameRepositoryFakeTest : GameRepositoryContract {
    override val gameRepository = GameRepositoryFake()
}
