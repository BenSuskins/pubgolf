package uk.co.suskins.pubgolf.controller

import com.natpryce.hamkrest.assertion.assertThat
import com.natpryce.hamkrest.equalTo
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import org.springframework.http.HttpStatus
import uk.co.suskins.pubgolf.events.GameEventCaptor
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameJoinRequest
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.PubDto
import uk.co.suskins.pubgolf.models.RouteResponse
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.models.ScoreRequest
import uk.co.suskins.pubgolf.models.SetPubsRequest
import uk.co.suskins.pubgolf.models.UpdateGameStatusRequest
import uk.co.suskins.pubgolf.repository.GameRepositoryFake
import uk.co.suskins.pubgolf.repository.PubRepositoryFake
import uk.co.suskins.pubgolf.service.GameService
import uk.co.suskins.pubgolf.service.PubRouteService
import uk.co.suskins.pubgolf.service.RoutingServiceFake

class GameControllerTest {
    private val gameRepository = GameRepositoryFake()
    private val pubRepository = PubRepositoryFake()
    private val eventCaptor = GameEventCaptor()
    private val eventPublisher =
        ApplicationEventPublisher { event ->
            eventCaptor.captureEvent(event as uk.co.suskins.pubgolf.events.GameEvent)
        }
    private val gameService = GameService(gameRepository, eventPublisher)
    private val routingService = RoutingServiceFake()
    private val pubRouteService = PubRouteService(gameRepository, pubRepository, routingService, gameService)
    private val controller = GameController(gameService, pubRouteService)

    @Test
    fun `returns 404 NOT_FOUND when game not found`() {
        val response = controller.gameState(GameCode("NOTFOUND123"))

        assertThat(response.statusCode, equalTo(HttpStatus.NOT_FOUND))
    }

    @Test
    fun `returns 403 FORBIDDEN when player not in game`() {
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
                PlayerId.random().value.toString(),
                ScoreRequest(Hole(1), Score(5)),
            )

        assertThat(response.statusCode, equalTo(HttpStatus.FORBIDDEN))
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

        val response = controller.randomise(GameCode("ACE007"), player.id.value.toString())

        assertThat(response.statusCode, equalTo(HttpStatus.CONFLICT))
    }

    @Test
    fun `returns 400 BAD_REQUEST when requesting a status other than COMPLETED`() {
        val hostPlayer = Player(PlayerId.random(), PlayerName("Ben"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(hostPlayer),
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val response =
            controller.updateGameStatus(
                GameCode("ACE007"),
                hostPlayer.id.value.toString(),
                UpdateGameStatusRequest(GameStatus.ACTIVE),
            )

        assertThat(response.statusCode, equalTo(HttpStatus.BAD_REQUEST))
    }

    @Test
    fun `host can replace an existing pub route`() {
        val hostPlayer = Player(PlayerId.random(), PlayerName("Ben"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(hostPlayer),
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)
        val hostId = hostPlayer.id.value.toString()

        val first = controller.setPubs(GameCode("ACE007"), hostId, SetPubsRequest(pubDtos("Old")))
        assertThat(first.statusCode, equalTo(HttpStatus.CREATED))

        val second = controller.setPubs(GameCode("ACE007"), hostId, SetPubsRequest(pubDtos("New")))
        assertThat(second.statusCode, equalTo(HttpStatus.CREATED))

        val route = controller.getRoute(GameCode("ACE007"))
        val body = route.body as RouteResponse
        assertThat(body.pubs.first().name, equalTo("New 1"))
    }

    @Test
    fun `returns 403 FORBIDDEN when non-host sets pubs`() {
        val hostPlayer = Player(PlayerId.random(), PlayerName("Ben"))
        val otherPlayer = Player(PlayerId.random(), PlayerName("Other"))
        val game =
            Game(
                id = GameId.random(),
                code = GameCode("ACE007"),
                players = listOf(hostPlayer, otherPlayer),
                hostPlayerId = hostPlayer.id,
            )
        gameRepository.save(game)

        val response =
            controller.setPubs(
                GameCode("ACE007"),
                otherPlayer.id.value.toString(),
                SetPubsRequest(pubDtos("Pub")),
            )

        assertThat(response.statusCode, equalTo(HttpStatus.FORBIDDEN))
    }

    private fun pubDtos(prefix: String) = (1..9).map { PubDto("$prefix $it", 51.5 + it * 0.001, -0.1 + it * 0.001) }

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
        for (hole in 1..9) {
            gameService.submitScore(GameCode("ACE007"), player.id, Hole(hole), Score(2))
        }

        val response = controller.randomise(GameCode("ACE007"), player.id.value.toString())

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

        val response =
            controller.updateGameStatus(
                GameCode("ACE007"),
                hostPlayer.id.value.toString(),
                UpdateGameStatusRequest(GameStatus.COMPLETED),
            )

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

        val response =
            controller.updateGameStatus(
                GameCode("ACE007"),
                otherPlayer.id.value.toString(),
                UpdateGameStatusRequest(GameStatus.COMPLETED),
            )

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

        val response =
            controller.updateGameStatus(
                GameCode("ACE007"),
                hostPlayer.id.value.toString(),
                UpdateGameStatusRequest(GameStatus.COMPLETED),
            )

        assertThat(response.statusCode, equalTo(HttpStatus.CONFLICT))
    }
}
