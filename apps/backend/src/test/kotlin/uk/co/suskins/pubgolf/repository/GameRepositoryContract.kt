package uk.co.suskins.pubgolf.repository

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.hamkrest.isFailure
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Tag
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.ActiveProfiles
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameNotFoundFailure
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.Penalty
import uk.co.suskins.pubgolf.models.PenaltyType
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

    @Test
    fun `can save and find a game with player penalties`() {
        val playerWithPenalty =
            Player(
                id = PlayerId.random(),
                name = PlayerName("Ben"),
                penalties = listOf(Penalty(Hole(3), PenaltyType.SKIP)),
            )
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("PENALTY001"),
                players = listOf(playerWithPenalty),
            )

        val saved =
            gameRepository
                .save(game)
                .valueOrNull()!!
        val savedPlayer = saved.players.first()
        assertThat(savedPlayer.penalties.size, equalTo(1))
        assertThat(savedPlayer.penalties.first().hole, equalTo(Hole(3)))
        assertThat(savedPlayer.penalties.first().type, equalTo(PenaltyType.SKIP))

        val found =
            gameRepository
                .findByCodeIgnoreCase(GameCode("PENALTY001"))
                .valueOrNull()!!
        val foundPlayer = found.players.first()
        assertThat(foundPlayer.penalties.size, equalTo(1))
        assertThat(foundPlayer.penalties.first().hole, equalTo(Hole(3)))
        assertThat(foundPlayer.penalties.first().type, equalTo(PenaltyType.SKIP))
    }
}

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
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
