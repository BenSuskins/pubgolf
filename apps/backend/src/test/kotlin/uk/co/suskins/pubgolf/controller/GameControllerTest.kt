package uk.co.suskins.pubgolf.controller

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import uk.co.suskins.pubgolf.models.CompleteGameRequest
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameJoinRequest
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.models.ScoreRequest
import uk.co.suskins.pubgolf.repository.GameRepositoryFake
import uk.co.suskins.pubgolf.repository.PubRepositoryFake
import uk.co.suskins.pubgolf.service.GameMetrics
import uk.co.suskins.pubgolf.service.GameService
import uk.co.suskins.pubgolf.service.GameStateBroadcasterFake
import uk.co.suskins.pubgolf.service.PubRouteService
import uk.co.suskins.pubgolf.service.RoutingServiceFake

class GameControllerTest {
    private val gameRepository = GameRepositoryFake()
    private val pubRepository = PubRepositoryFake()
    private val gameMetrics = GameMetrics(SimpleMeterRegistry())
    private val gameStateBroadcaster = GameStateBroadcasterFake()
    private val gameService = GameService(gameRepository, gameMetrics, gameStateBroadcaster)
    private val routingService = RoutingServiceFake()
    private val pubRouteService = PubRouteService(gameRepository, pubRepository, routingService)
    private val controller = GameController(gameService, pubRouteService)

    @Test
    fun `returns 404 NOT_FOUND when game not found`() {
        val response = controller.gameState(GameCode("NOTFOUND123"))

        assertThat(response.statusCode, equalTo(HttpStatus.NOT_FOUND))
    }

    @Test
    fun `returns 404 NOT_FOUND when player not found`() {
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(Player(PlayerId.random(), PlayerName("Ben"))),
            )
        gameRepository.save(game)

        val response =
            controller.submitScore(
                GameCode("ACE007"),
                PlayerId.random(),
                ScoreRequest(Hole(1), Score(5)),
            )

        assertThat(response.statusCode, equalTo(HttpStatus.NOT_FOUND))
    }

    @Test
    fun `returns 400 BAD_REQUEST when player already exists`() {
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(Player(PlayerId.random(), PlayerName("Ben"))),
            )
        gameRepository.save(game)

        val response =
            controller.joinGame(
                GameCode("ACE007"),
                GameJoinRequest(PlayerName("Ben")),
            )

        assertThat(response.statusCode, equalTo(HttpStatus.BAD_REQUEST))
    }

    @Test
    fun `returns 409 CONFLICT when randomise already used`() {
        val player = Player(PlayerId.random(), PlayerName("Ben"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(player),
            )
        gameRepository.save(game)
        gameService.submitScore(GameCode("ACE007"), player.id, Hole(1), Score(5))
        gameService.randomise(GameCode("ACE007"), player.id)

        val response = controller.randomise(GameCode("ACE007"), player.id)

        assertThat(response.statusCode, equalTo(HttpStatus.CONFLICT))
    }

    @Test
    fun `returns 409 CONFLICT when no more holes left for randomise`() {
        val player = Player(PlayerId.random(), PlayerName("Ben"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(player),
            )
        gameRepository.save(game)
        gameService.submitScore(GameCode("ACE007"), player.id, Hole(9), Score(5))

        val response = controller.randomise(GameCode("ACE007"), player.id)

        assertThat(response.statusCode, equalTo(HttpStatus.CONFLICT))
    }

    @Test
    fun `returns 200 OK when host completes game`() {
        val hostPlayer = Player(PlayerId.random(), PlayerName("Ben"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(hostPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val response = controller.completeGame(GameCode("ACE007"), CompleteGameRequest(hostPlayer.id))

        assertThat(response.statusCode, equalTo(HttpStatus.OK))
    }

    @Test
    fun `returns 403 FORBIDDEN when non-host tries to complete game`() {
        val hostPlayer = Player(PlayerId.random(), PlayerName("Ben"))
        val otherPlayer = Player(PlayerId.random(), PlayerName("Other"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(hostPlayer, otherPlayer),
                status = GameStatus.ACTIVE,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val response = controller.completeGame(GameCode("ACE007"), CompleteGameRequest(otherPlayer.id))

        assertThat(response.statusCode, equalTo(HttpStatus.FORBIDDEN))
    }

    @Test
    fun `returns 409 CONFLICT when completing already completed game`() {
        val hostPlayer = Player(PlayerId.random(), PlayerName("Ben"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(hostPlayer),
                status = GameStatus.COMPLETED,
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val response = controller.completeGame(GameCode("ACE007"), CompleteGameRequest(hostPlayer.id))

        assertThat(response.statusCode, equalTo(HttpStatus.CONFLICT))
    }
}
