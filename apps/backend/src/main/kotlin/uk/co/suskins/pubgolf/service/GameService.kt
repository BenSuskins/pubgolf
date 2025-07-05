package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.*
import uk.co.suskins.pubgolf.repository.GameRepository

@Service
class GameService(private val gameRepository: GameRepository, private val gameMetrics: GameMetrics) {
    private val logger = LoggerFactory.getLogger(GameService::class.java)

    fun createGame(name: PlayerName): Result<Game, PubGolfFailure> {
        val host = Player(PlayerId.random(), name)
        val game = Game(
            id = GameId.random(),
            code = GameCode.random(),
            players = listOf(host)
        )

        return gameRepository.save(game).map { it }
            .peek { logger.info("Game ${it.code.value} created.") }
            .also { gameMetrics.gameCreated() }
    }

    fun joinGame(gameCode: GameCode, name: PlayerName): Result<Game, PubGolfFailure> =
        gameRepository.findByCodeIgnoreCase(gameCode).flatMap { game ->
            if (game.players.any { it.name.value.equals(name.value, ignoreCase = true) }) {
                Failure(PlayerAlreadyExistsFailure("Player `${name.value}` already exists for game `${gameCode.value}`."))
            } else {
                val player = Player(PlayerId.random(), name)
                val updated = game.copy(players = game.players + player)
                gameRepository.save(updated)
                    .map { game.copy(players = listOf(player)) }
                    .also { gameMetrics.playerJoined() }
            }
        }

    fun gameState(gameCode: GameCode): Result<Game, PubGolfFailure> = gameRepository.findByCodeIgnoreCase(gameCode)

    fun submitScore(gameCode: GameCode, playerId: PlayerId, hole: Hole, score: Score): Result<Unit, PubGolfFailure> =
        gameRepository.findByCodeIgnoreCase(gameCode)
            .flatMap { hasPlayer(it, playerId) }
            .flatMap { game ->
                val updatedPlayers = game.players.map {
                    if (it.matches(playerId)) {
                        it.updateScore(hole, score)
                    } else {
                        it
                    }
                }
                gameRepository.save(game.copy(players = updatedPlayers)).map { }
                    .also { gameMetrics.scoreSubmitted(hole) }
            }

    fun imFeelingLucky(gameCode: GameCode, playerId: PlayerId): Result<ImFeelingLucky, PubGolfFailure> =
        gameRepository.findByCodeIgnoreCase(gameCode)
            .flatMap { hasPlayer(it, playerId) }
            .flatMap { game ->
                generateResult(playerId, game)
            }

    private fun hasPlayer(game: Game, playerId: PlayerId): Result<Game, PubGolfFailure> =
        if (game.players.none { it.matches(playerId) }) {
            Failure(PlayerNotFoundFailure("Player `${playerId.value}` not found for game `${game.code.value}`."))
        } else {
            Success(game)
        }

    private fun generateResult(playerId: PlayerId, game: Game): Result<ImFeelingLucky, PubGolfFailure> {
        val lastHole = Hole(1) //todo this
        val luckyHole = Hole(lastHole.value + 1)

        val outcome = Outcomes.random()

        val updatedPlayers = game.players.map {
            if (it.matches(playerId)) {
                it.updateLucky(luckyHole, outcome)
            } else {
                it
            }
        }
        gameRepository.save(game.copy(players = updatedPlayers))

        return Success(
            ImFeelingLucky(
                result = outcome.label,
                hole = luckyHole,
                outcomes = Outcomes.entries
            )
        ).also { gameMetrics.imFeelingLuckyUsed() }
    }
}
