package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.peekFailure
import dev.forkhandles.result4k.recover
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameConstants
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.InvalidHostFailure
import uk.co.suskins.pubgolf.models.InvalidPubCountFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.Pub
import uk.co.suskins.pubgolf.models.PubDto
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.PubId
import uk.co.suskins.pubgolf.models.PubsAlreadySetFailure
import uk.co.suskins.pubgolf.models.RouteGeometry
import uk.co.suskins.pubgolf.repository.GameRepository
import uk.co.suskins.pubgolf.repository.PubRepository

@Service
class PubRouteService(
    private val gameRepository: GameRepository,
    private val pubRepository: PubRepository,
    private val routingService: RoutingService,
    private val gameService: GameService,
) {
    private val logger = LoggerFactory.getLogger(PubRouteService::class.java)

    fun setPubsForGame(
        gameCode: GameCode,
        hostPlayerId: PlayerId,
        pubDtos: List<PubDto>,
    ): Result<Game, PubGolfFailure> =
        validatePubCount(pubDtos)
            .flatMap { gameService.validatePlayerInGame(gameCode, hostPlayerId) }
            .flatMap { game -> validateHost(game, hostPlayerId) }
            .flatMap { game -> validateNoPubsSet(game) }
            .flatMap { game ->
                val pubs =
                    pubDtos.mapIndexed { index, dto ->
                        Pub(
                            id = PubId.random(),
                            gameId = game.id,
                            hole = Hole(index + 1),
                            name = dto.name,
                            latitude = dto.latitude,
                            longitude = dto.longitude,
                        )
                    }

                pubRepository
                    .saveAll(pubs)
                    .map { savedPubs ->
                        val routeGeometry = calculateRoute(savedPubs)
                        game.copy(pubs = savedPubs, routeGeometry = routeGeometry)
                    }
            }.flatMap { game -> gameRepository.save(game) }

    fun getRouteForGame(gameCode: GameCode): Result<Pair<List<Pub>, RouteGeometry?>, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { game ->
                pubRepository
                    .findByGameId(game.id)
                    .map { pubs -> pubs to game.routeGeometry }
            }

    private fun validateHost(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.hostPlayerId == playerId) {
            Success(game)
        } else {
            Failure(InvalidHostFailure("Only the host can set pubs for this game"))
        }

    private fun validateNoPubsSet(game: Game): Result<Game, PubGolfFailure> =
        if (game.pubs.isEmpty()) {
            Success(game)
        } else {
            Failure(PubsAlreadySetFailure("Pubs have already been set for this game"))
        }

    private fun validatePubCount(pubDtos: List<PubDto>): Result<List<PubDto>, PubGolfFailure> =
        if (pubDtos.size == GameConstants.MAX_HOLES) {
            Success(pubDtos)
        } else {
            Failure(InvalidPubCountFailure("Exactly ${GameConstants.MAX_HOLES} pubs are required, but ${pubDtos.size} were provided"))
        }

    private fun calculateRoute(pubs: List<Pub>): RouteGeometry? =
        routingService
            .calculateRoute(pubs)
            .peekFailure { logger.warn("Failed to calculate route, continuing without route: ${it.message}") }
            .recover { null }
}
