package uk.co.suskins.pubgolf.repository

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import dev.forkhandles.result4k.valueOrNull
import org.junit.jupiter.api.Tag
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.ActiveProfiles
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubId
import kotlin.test.Test
import kotlin.test.assertEquals

interface PubRepositoryContract {
    val pubRepository: PubRepository
    val gameRepository: GameRepository

    @Test
    fun `can save and find pubs for a game`() {
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("PUB001"),
                players =
                    listOf(
                        Player(PlayerId.random(), PlayerName("Ben")),
                    ),
            )
        gameRepository.save(game)

        val pubs =
            listOf(
                Pub(
                    id = PubId.random(),
                    gameId = game.id,
                    hole = Hole(1),
                    name = "The Red Lion",
                    latitude = 51.5074,
                    longitude = -0.1278,
                ),
                Pub(
                    id = PubId.random(),
                    gameId = game.id,
                    hole = Hole(2),
                    name = "The Green Dragon",
                    latitude = 51.5080,
                    longitude = -0.1280,
                ),
            )

        val saved = pubRepository.saveAll(pubs).valueOrNull()!!
        assertThat(saved.size, equalTo(2))

        val found = pubRepository.findByGameId(game.id).valueOrNull()!!
        assertThat(found.size, equalTo(2))
        assertThat(found[0].name, equalTo("The Red Lion"))
        assertThat(found[1].name, equalTo("The Green Dragon"))
    }

    @Test
    fun `pubs are ordered by hole number`() {
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("PUB002"),
                players =
                    listOf(
                        Player(PlayerId.random(), PlayerName("Alice")),
                    ),
            )
        gameRepository.save(game)

        val pubs =
            listOf(
                Pub(
                    id = PubId.random(),
                    gameId = game.id,
                    hole = Hole(3),
                    name = "Third Pub",
                    latitude = 51.5074,
                    longitude = -0.1278,
                ),
                Pub(
                    id = PubId.random(),
                    gameId = game.id,
                    hole = Hole(1),
                    name = "First Pub",
                    latitude = 51.5080,
                    longitude = -0.1280,
                ),
                Pub(
                    id = PubId.random(),
                    gameId = game.id,
                    hole = Hole(2),
                    name = "Second Pub",
                    latitude = 51.5085,
                    longitude = -0.1285,
                ),
            )

        pubRepository.saveAll(pubs)

        val found = pubRepository.findByGameId(game.id).valueOrNull()!!
        assertThat(found.size, equalTo(3))
        assertEquals("First Pub", found[0].name)
        assertEquals("Second Pub", found[1].name)
        assertEquals("Third Pub", found[2].name)
    }

    @Test
    fun `returns empty list when game has no pubs`() {
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("PUB003"),
                players =
                    listOf(
                        Player(PlayerId.random(), PlayerName("Charlie")),
                    ),
            )
        gameRepository.save(game)

        val found = pubRepository.findByGameId(game.id).valueOrNull()!!
        assertThat(found.size, equalTo(0))
    }
}

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Tag("integration")
class PubRepositoryAdapterTest : PubRepositoryContract {
    @Autowired
    lateinit var store: PubJpaRepository

    @Autowired
    lateinit var gameStore: GameJpaRepository

    override val pubRepository: PubRepository
        get() = PubRepositoryAdapter(store, gameStore)

    override val gameRepository: GameRepository
        get() = GameRepositoryAdapter(gameStore)
}

class PubRepositoryFakeTest : PubRepositoryContract {
    override val gameRepository = GameRepositoryFake()
    override val pubRepository = PubRepositoryFake()
}
