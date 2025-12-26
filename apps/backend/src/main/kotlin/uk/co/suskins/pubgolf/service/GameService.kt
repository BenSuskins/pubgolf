package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.peek
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.ImFeelingLucky
import uk.co.suskins.pubgolf.models.ImFeelingLuckyUsedFailure
import uk.co.suskins.pubgolf.models.Outcomes
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.repository.GameRepository

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val gameMetrics: GameMetrics,
) {
    private val logger = LoggerFactory.getLogger(GameService::class.java)

    fun createGame(name: PlayerName): Result<Game, PubGolfFailure> {
        val host = Player(PlayerId.random(), name)
        val game =
            Game(
                id = GameId.random(),
                code = GameCode.random(),
                players = listOf(host),
            )

        return gameRepository
            .save(game)
            .map { it }
            .peek { logger.info("Game ${it.code.value} created.") }
            .also { gameMetrics.gameCreated() }
    }

    fun joinGame(
        gameCode: GameCode,
        name: PlayerName,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { hasPlayer(it, name) }
            .flatMap { game ->
                val player = Player(PlayerId.random(), name)
                val updated = game.copy(players = game.players + player)
                gameRepository
                    .save(updated)
                    .map { game.copy(players = listOf(player)) }
                    .also { gameMetrics.playerJoined() }
            }

    fun gameState(gameCode: GameCode): Result<Game, PubGolfFailure> = gameRepository.findByCodeIgnoreCase(gameCode)

    fun submitScore(
        gameCode: GameCode,
        playerId: PlayerId,
        hole: Hole,
        score: Score,
    ): Result<Unit, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { hasPlayer(it, playerId) }
            .flatMap { game ->
                val updatedPlayers =
                    game.players.map {
                        if (it.matches(playerId)) {
                            it.updateScore(hole, score)
                        } else {
                            it
                        }
                    }
                gameRepository
                    .save(game.copy(players = updatedPlayers))
                    .map { }
                    .also { gameMetrics.scoreSubmitted(hole) }
            }

    fun imFeelingLucky(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<ImFeelingLucky, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { hasPlayer(it, playerId) }
            .flatMap { hasUsedLucky(it, playerId) }
            .flatMap { game -> generateResult(playerId, game) }

    private fun hasPlayer(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.players.none { it.matches(playerId) }) {
            Failure(PlayerNotFoundFailure("Player `${playerId.value}` not found for game `${game.code.value}`."))
        } else {
            Success(game)
        }

    private fun hasPlayer(
        game: Game,
        name: PlayerName,
    ): Result<Game, PubGolfFailure> =
        if (game.players.any { it.name.value.equals(name.value, ignoreCase = true) }) {
            Failure(PlayerAlreadyExistsFailure("Player `${name.value}` already exists for game `${game.code.value}`."))
        } else {
            Success(game)
        }

    private fun generateResult(
        playerId: PlayerId,
        game: Game,
    ): Result<ImFeelingLucky, PubGolfFailure> {
        return luckyHole(game, playerId).flatMap { luckyHole ->
            val outcome = Outcomes.random()

            val updatedPlayers =
                game.players.map {
                    if (it.matches(playerId)) {
                        it.updateLucky(luckyHole, outcome)
                    } else {
                        it
                    }
                }
            return gameRepository.save(game.copy(players = updatedPlayers)).flatMap {
                Success(
                    ImFeelingLucky(
                        result = outcome.label,
                        hole = luckyHole,
                        outcomes = Outcomes.entries,
                    ),
                ).also { gameMetrics.imFeelingLuckyUsed() }
            }
        }
    }

    private fun luckyHole(
        game: Game,
        playerId: PlayerId,
    ): Result<Hole, PubGolfFailure> {
        val scores = game.players.first { it.id == playerId }.scores

        // Check if all timestamps are the same (no scores actually submitted)
        val timestamps = scores.values.map { it.instant }.toSet()
        if (timestamps.size == 1) {
            return Success(Hole(1))
        }

        val mostRecent = scores.maxByOrNull { it.value.instant }
        val mostRecentHole = mostRecent?.key!!

        return if (mostRecentHole.value == 9) {
            Failure(ImFeelingLuckyUsedFailure("No more holes left"))
        } else {
            Success(Hole(mostRecentHole.value + 1))
        }
    }

    private fun hasUsedLucky(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> {
        val find = game.players.find { it.id == playerId }
        return if (find?.lucky == null) {
            Success(game)
        } else {
            Failure(ImFeelingLuckyUsedFailure("ImFeelingLucky already used"))
        }
    }
}
