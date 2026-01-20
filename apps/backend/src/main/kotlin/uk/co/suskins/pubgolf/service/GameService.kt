package uk.co.suskins.pubgolf.service

import dev.forkhandles.result4k.Failure
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import dev.forkhandles.result4k.flatMap
import dev.forkhandles.result4k.map
import dev.forkhandles.result4k.peek
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import uk.co.suskins.pubgolf.models.ActiveEvent
import uk.co.suskins.pubgolf.models.EventAlreadyActiveFailure
import uk.co.suskins.pubgolf.models.EventNotFoundFailure
import uk.co.suskins.pubgolf.models.Game
import uk.co.suskins.pubgolf.models.GameAlreadyCompletedFailure
import uk.co.suskins.pubgolf.models.GameCode
import uk.co.suskins.pubgolf.models.GameEvent
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
import uk.co.suskins.pubgolf.models.PlayerNotInGameFailure
import uk.co.suskins.pubgolf.models.PubGolfFailure
import uk.co.suskins.pubgolf.models.RandomiseAlreadyUsedFailure
import uk.co.suskins.pubgolf.models.RandomiseResult
import uk.co.suskins.pubgolf.models.Score
import uk.co.suskins.pubgolf.repository.GameRepository
import java.time.Instant

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val gameMetrics: GameMetrics,
    private val gameStateBroadcaster: GameStateBroadcaster,
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
                    .peek { gameStateBroadcaster.broadcast(it) }
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
                    .peek { gameStateBroadcaster.broadcast(it) }
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
            .flatMap { game ->
                generateRandomiseResult(playerId, game).flatMap { randomiseResult ->
                    gameRepository
                        .findByCodeIgnoreCase(gameCode)
                        .peek { gameStateBroadcaster.broadcast(it) }
                        .map { randomiseResult }
                }
            }

    fun completeGame(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Game is already completed") }
            .flatMap { isHost(it, playerId) }
            .flatMap { game ->
                val completed = game.copy(status = GameStatus.COMPLETED, activeEvent = null)
                gameRepository
                    .save(completed)
                    .peek { gameStateBroadcaster.broadcast(it) }
                    .peek { logger.info("Game ${it.code.value} completed.") }
                    .also { gameMetrics.gameCompleted() }
            }

    fun getAvailableEvents(): List<GameEvent> = GameEvent.entries.toList()

    fun validatePlayerInGame(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { game ->
                if (game.players.none { it.matches(playerId) }) {
                    Failure(PlayerNotInGameFailure("Player `${playerId.value}` does not belong to game `${gameCode.value}`."))
                } else {
                    Success(game)
                }
            }

    fun getActiveEvent(gameCode: GameCode): Result<ActiveEvent?, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .map { it.activeEvent }

    fun activateEvent(
        gameCode: GameCode,
        playerId: PlayerId,
        eventId: String,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isNotCompleted(it, "Cannot activate event on completed game") }
            .flatMap { isHost(it, playerId) }
            .flatMap { hasNoActiveEvent(it) }
            .flatMap { game ->
                val event =
                    GameEvent.fromId(eventId)
                        ?: return@flatMap Failure(EventNotFoundFailure("Event '$eventId' not found"))
                val activeEvent = ActiveEvent(event, Instant.now())
                val updated = game.copy(activeEvent = activeEvent)
                gameRepository
                    .save(updated)
                    .peek { gameStateBroadcaster.broadcast(it) }
                    .peek { logger.info("Event '${event.title}' activated for game ${it.code.value}") }
            }

    fun endEvent(
        gameCode: GameCode,
        playerId: PlayerId,
    ): Result<Game, PubGolfFailure> =
        gameRepository
            .findByCodeIgnoreCase(gameCode)
            .flatMap { isHost(it, playerId) }
            .flatMap { game ->
                if (game.activeEvent == null) {
                    Success(game)
                } else {
                    val updated = game.copy(activeEvent = null)
                    gameRepository
                        .save(updated)
                        .peek { gameStateBroadcaster.broadcast(it) }
                        .peek { logger.info("Event ended for game ${it.code.value}") }
                }
            }

    private fun hasNoActiveEvent(game: Game): Result<Game, PubGolfFailure> =
        if (game.activeEvent != null) {
            Failure(EventAlreadyActiveFailure("An event is already active. End the current event before activating a new one."))
        } else {
            Success(game)
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
                .peek { gameStateBroadcaster.broadcast(it) }
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

        val mostRecentHole =
            scores.maxByOrNull { it.value.instant }?.key
                ?: return Failure(RandomiseAlreadyUsedFailure("No scores found for player"))

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
