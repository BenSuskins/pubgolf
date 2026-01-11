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
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameId
import uk.co.suskins.pubgolf.models.GameStatus
import uk.co.suskins.pubgolf.models.Hole
import uk.co.suskins.pubgolf.models.NotHostPlayerFailure
import uk.co.suskins.pubgolf.models.Outcomes
import uk.co.suskins.pubgolf.models.PenaltyType
import uk.co.suskins.pubgolf.models.Player
import uk.co.suskins.pubgolf.models.PlayerAlreadyExistsFailure
import uk.co.suskins.pubgolf.models.PlayerId
import uk.co.suskins.pubgolf.models.PlayerName
import uk.co.suskins.pubgolf.models.PlayerNotFoundFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.RandomiseResult
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.repository.GameRepository

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val gameMetrics: GameMetrics,
    private val gameBroadcastService: GameBroadcastService,
) {
    private val logger = LoggerFactory.getLogger(GameService::class.java)

    fun createGame(name: PlayerName): Result<Game, PubGolfFailure> {
        val host = Player(PlayerId.random(), name)
        val game =
            Game(
                id = GameId.random(),
                code = GameCode.random(),
                players = listOf(host),
                status = GameStatus.ACTIVE,
                hostPlayerId = host.id,
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
            .flatMap { isNotCompleted(it, "This game has ended") }
            .flatMap { hasPlayer(it, name) }
            .flatMap { game ->
                val player = Player(PlayerId.random(), name)
                val updated = game.copy(players = game.players + player)
                gameRepository
                    .save(updated)
                    .peek { gameBroadcastService.scheduleGameStateBroadcast(gameCode) }
                    .map { game.copy(players = listOf(player)) }
                    .also { gameMetrics.playerJoined() }
            }

    fun gameState(gameCode: GameCode): Result<Game, PubGolfFailure> = gameRepository.findByCodeIgnoreCase(gameCode)

    fun submitScore(
        gameCode: GameCode,
        playerId: PlayerId,
        hole: Hole,
        score: Score,
        penaltyType: PenaltyType? = null,
    ): Result<Unit, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Cannot submit score to completed game") }
            .flatMap { hasPlayer(it, playerId) }
            .flatMap { game ->
                val updatedPlayers =
                    game.players.map {
                        if (it.matches(playerId)) {
                            val actualScore = penaltyType?.let { Score(it.points) } ?: score
                            val withScore = it.updateScore(hole, actualScore)
                            if (penaltyType != null) {
                                withScore.updatePenalty(hole, penaltyType)
                            } else {
                                withScore.removePenalty(hole)
                            }
                        } else {
                            it
                        }
                    }
                gameRepository
                    .save(game.copy(players = updatedPlayers))
                    .peek { gameBroadcastService.scheduleGameStateBroadcast(gameCode) }
                    .map { }
                    .also { gameMetrics.scoreSubmitted(hole) }
            }

    fun randomise(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<RandomiseResult, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Cannot randomise on completed game") }
            .flatMap { hasPlayer(it, playerId) }
            .flatMap { hasUsedRandomise(it, playerId) }
            .flatMap { game -> generateRandomiseResult(playerId, game) }

    fun completeGame(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Game is already completed") }
            .flatMap { isHost(it, playerId) }
            .flatMap { game ->
                val completed = game.copy(status = GameStatus.COMPLETED)
                gameRepository
                    .save(completed)
                    .peek { gameBroadcastService.broadcastGameEnded(gameCode) }
                    .peek { logger.info("Game ${it.code.value} completed.") }
                    .also { gameMetrics.gameCompleted() }
            }

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

    private fun isNotCompleted(
        game: Game,
        message: String,
    ): Result<Game, PubGolfFailure> =
        if (game.status == GameStatus.COMPLETED) {
            Failure(GameAlreadyCompletedFailure(message))
        } else {
            Success(game)
        }

    private fun isHost(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        if (game.hostPlayerId != playerId) {
            Failure(NotHostPlayerFailure("Only the host can complete this game"))
        } else {
            Success(game)
        }

    private fun generateRandomiseResult(
        playerId: PlayerId,
        game: Game,
    ): Result<RandomiseResult, PubGolfFailure> {
        return randomiseHole(game, playerId).flatMap { randomiseHole ->
            val outcome = Outcomes.random()

            val updatedPlayers =
                game.players.map {
                    if (it.matches(playerId)) {
                        it.updateRandomise(randomiseHole, outcome)
                    } else {
                        it
                    }
                }
            return gameRepository
                .save(game.copy(players = updatedPlayers))
                .peek { gameBroadcastService.scheduleGameStateBroadcast(game.code) }
                .flatMap {
                    Success(
                        RandomiseResult(
                            result = outcome.label,
                            hole = randomiseHole,
                            outcomes = Outcomes.entries,
                        ),
                    ).also { gameMetrics.randomiseUsed() }
                }
        }
    }

    private fun randomiseHole(
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
            Failure(RandomiseAlreadyUsedFailure("No more holes left"))
        } else {
            Success(Hole(mostRecentHole.value + 1))
        }
    }

    private fun hasUsedRandomise(
        game: Game,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> {
        val find = game.players.find { it.id == playerId }
        return if (find?.randomise == null) {
            Success(game)
        } else {
            Failure(RandomiseAlreadyUsedFailure("Randomise already used"))
        }
    }
}
